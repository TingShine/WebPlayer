<script setup lang="ts">
import { onMounted } from 'vue';
import { PlayerManager } from '../../../packages/manager'

onMounted(() => {
  new PlayerManager({
    container: '.container',
    width: '800px',
    height: '400px',
    url: 'https://mms.vod.susercontent.com/api/v4/11111000/mms/my-11111000-6ke14-lxtirx2rlojq57.ori.mp4'
  })
})
</script>


<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <div class="container"></div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
