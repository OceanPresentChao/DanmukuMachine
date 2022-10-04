import * as pako from 'pako'
import * as brotli from 'brotli-compress/js'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cutBuffer(buffer: Uint8Array) {
  const bufferPacks: Uint8Array[] = []
  let size = 0
  for (let i = 0; i < buffer.length; i += size) {
    size = readInt(buffer, i, 4)
    bufferPacks.push(buffer.slice(i, i + size))
  }
  return bufferPacks
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
        protocol: readInt(buffer, 6, 2),
        operation: readInt(buffer, 8, 4),
        seq: readInt(buffer, 12, 4),
        body: [] as any,
        type: '',
      }
      if (result.operation === 3)
        result.type = 'heartbeat'
      if (result.operation === 5)
        result.type = 'message'
      if (result.operation === 8)
        result.type = 'welcome'

      const msgbody = buffer.slice(result.headerLen, result.packetLen)
      if (result.protocol === 0)
        result.body = JSON.parse(textDecoder.decode(msgbody))
      if (result.protocol === 1 && msgbody.length === 4)
        result.body = readInt(msgbody, 0, 4)
      if (result.protocol === 2) {
        // eslint-disable-next-line no-control-regex
        result.body = textDecoder.decode(pako.inflate(msgbody)).split(/[\x00-\x1F]+/)
          .filter(v => v[0] === '{').map((v) => {
            try {
              return JSON.parse(v)
            }
            catch {
              return ''
            }
          })
      }
      if (result.protocol === 3)
        result.body = brotli.decompress(msgbody.buffer)
      console.log(result.type, result.protocol, result.body)
      resolve(result)
    }
    reader.readAsArrayBuffer(blob)
  })
}
