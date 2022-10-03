/* eslint-disable no-console */
import * as pako from 'pako'
import * as config from './constant'
type IntBuffer = number[] | Uint8Array
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder('utf-8')

export function writeInt(buffer: IntBuffer, start: number, len: number, value: number) {
  let i = 0
  let sum = value
  while (i < len) {
    const int8 = Math.floor(sum / 256 ** (len - i - 1))
    buffer[start + i] = int8
    sum -= int8 * (256 ** (len - i - 1))
    i++
  }
}

export function readInt(buffer: IntBuffer, start: number, len: number) {
  let result = 0
  for (let i = 0; i < len; i++)
    result += 256 ** (len - i - 1) * buffer[start + i]
  return result
}

export function encode(body: any, opType: 'heartbeat' | 'join') {
  if (typeof body !== 'string')
    body = JSON.stringify(body)
  const data = textEncoder.encode(body)
  const packageLen = 16 + data.byteLength
  const header = new ArrayBuffer(16)
  const view = new Uint8Array(header)
  // 数据包长度
  writeInt(view, 0, 4, packageLen)
  // 数据包头部长度
  writeInt(view, 4, 2, 16)
  // 协议版本
  writeInt(view, 6, 2, 1)
  // 操作类型
  if (opType === 'heartbeat')
    writeInt(view, 8, 4, 2)
  else if (opType === 'join')
    writeInt(view, 8, 4, 7)
  // 数据包头部信息
  writeInt(view, 12, 4, 1)
  return Uint8Array.from([...view, ...data]).buffer
}

export function decode(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = function (ev) {
      if (!ev.target || !ev.target.result || typeof ev.target.result === 'string') {
        reject(new Error('receive Error'))
        return
      }
      const buffer = new Uint8Array(ev.target.result)
      const result = {
        packetLen: readInt(buffer, 0, 4),
        headerLen: readInt(buffer, 4, 2),
        ver: readInt(buffer, 6, 2),
        op: readInt(buffer, 8, 4),
        seq: readInt(buffer, 12, 4),
        body: {
          count: -1,
          content: [] as any[],
        },
      }
      console.log(result)
      if (result.op === config.WS_OP_MESSAGE) {
        let offset = 0
        while (offset < buffer.length) {
          const packetLen = readInt(buffer, offset + 0, 4)
          const headerLen = 16// readInt(buffer,offset + 4,4)
          const data = buffer.slice(offset + headerLen, offset + packetLen)

          /**
           * 仅有两处更改
           * 1. 引入pako做message解压处理，具体代码链接如下
           *    https://github.com/nodeca/pako/blob/master/dist/pako.js
           * 2. message文本中截断掉不需要的部分，避免JSON.parse时出现问题
           */

          let body = ''
          try {
            // pako可能无法解压
            body = textDecoder.decode(pako.inflate(data))
            console.log('pako解压为', body)
          }
          catch (e) {
            body = textDecoder.decode(data)
            console.log('pako无法解压', body)
          }

          if (!body) {
            // 同一条 message 中可能存在多条信息，用正则筛出来
            // eslint-disable-next-line no-control-regex
            const group = body.split(/[\x00-\x1F]+/)
            console.log('group', group)
            group.forEach((item) => {
              try {
                const parsedItem = JSON.parse(item)
                if (typeof parsedItem === 'object') {
                  result.body.content.push(parsedItem)
                }
                else {
                  // 这里item可能会解析出number
                  // 此时可以尝试重新用pako解压data（携带转换参数）
                  // const newBody = textDecoder.decode(pako.inflate(data, {to: 'String'}))
                  // 重复上面的逻辑，筛选可能存在的多条信息
                  // 初步验证，这里可以解析到INTERACT_WORD、DANMU_MSG、ONLINE_RANK_COUNT
                  // SEND_GIFT、SUPER_CHAT_MESSAGE
                }
              }
              catch (e) {
                // 忽略非 JSON 字符串，通常情况下为分隔符
                console.error(e)
              }
            })
          }
          offset += packetLen
        }
      }
      else if (result.op === config.WS_OP_HEARTBEAT_REPLY) {
        result.body.count = readInt(buffer, 16, 4)
      }
      resolve(result)
    }
    reader.readAsArrayBuffer(blob)
  })
}
