<script setup lang="ts">
import { ref } from 'vue'
import { LIVE_SSL_URL, LIVE_URL } from '../utils/constant'
import { decode, encode } from '../utils/headhandle'
const roomId = ref(33989)
function connectRoom(roomId: number) {
  const ws = new WebSocket(LIVE_SSL_URL)
  ws.onopen = function () {
    ws.send(encode(JSON.stringify({
      roomid: roomId,
    }), 'join'))
    setInterval(() => {
      ws.send(encode('', 'heartbeat'))
    }, 30000)
    ws.onmessage = async function (msgEvent) {
      const packet = await decode(msgEvent.data) as any
      switch (packet.operatin) {
        case 8:
          console.log('加入房间')
          break
        case 3:{
          const count = packet.body
          console.log(`人气：${count}`)
        }
          break
        case 5:
          packet.body.forEach((body: any) => {
            switch (body.cmd) {
              case 'DANMU_MSG':
                console.log(`${body.info[2][1]}: ${body.info[1]}`)
                break
              case 'SEND_GIFT':
                console.log(`${body.data.uname} ${body.data.action} ${body.data.num} 个 ${body.data.giftName}`)
                break
              case 'WELCOME':
                console.log(`欢迎 ${body.data.uname}`)
                break
                // 此处省略很多其他通知类型
              default:
                console.log(body)
            }
          })
          break
        default:
          console.log(packet)
      }
    }
  }
// 如果使用的是控制台，这两句一定要一起执行，否侧onopen不会被触发
}
</script>

<template>
  <div>
    <label>请输入直播间id</label>
    <input v-model="roomId" type="number">
    <button @click="connectRoom(roomId)">
      click me
    </button>
  </div>
</template>

<style scoped>

</style>
