<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { emit, listen } from '@tauri-apps/api/event'
const greetMsg = ref('')
const name = ref('')
const unlisten = await listen('click', async (event) => {
  // event.event is the event name (useful if you want to use a single callback fn for multiple event types)
  // event.payload is the payload object
  console.log(event)
  greetMsg.value = await invoke('greet', { name: name.value })
})
async function greet() {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  emit('click', {
    theMessage: 'Tauri is awesome!',
  })
}
</script>

<template>
  <div class="card">
    <input id="greet-input" v-model="name" placeholder="Enter a name...">
    <button type="button" @click="greet()">
      Greet
    </button>
  </div>

  <p>{{ greetMsg }}</p>
</template>
