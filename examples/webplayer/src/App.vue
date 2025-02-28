<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { WebPlayer } from '@web-player/base'
import { PlayerEventEnum } from '@web-player/base';

import "@web-player/base/dist/index.css"

const playerInstance = ref<WebPlayer>()
const method = ref('url')
const url = ref('https://mms.vod.susercontent.com/api/v4/11111000/mms/my-11111000-6ke14-lxtirx2rlojq57.ori.mp4')
const files = ref<File[]>([])

const handleSubmit = () => {
  if (playerInstance.value) {
    playerInstance.value.destroy()
  }

  const start = performance.now()
  if (method.value === 'url') {
    playerInstance.value = new WebPlayer({
      container: '.container',
      width: '800px',
      height: '400px',
      input: url.value
    })
  } else {
    playerInstance.value = new WebPlayer({
      container: '.container',
      width: '800px',
      height: '400px',
      input: files.value[0]!
    })
  }

  playerInstance.value.addEventListener(PlayerEventEnum.CANPLAY, () => {
    const cost = performance.now() - start
    console.log('Video can play cost: ' + cost + " ms");
  })
}
 
onUnmounted(() => {
  if (playerInstance.value) {
    playerInstance.value.destroy()
  }
})
</script>


<template>
  <div style="width: 800px;">
    <div class="text-4xl mb-20 font-bold">WebCodecs Player</div>
    <el-form label-width="20%"  label-position="right" class="text-center mb-10">
      <el-form-item label="Method:">
        <el-radio-group v-model="method" size="large">
          <el-radio-button label="URL" value="url" ></el-radio-button>
          <el-radio-button label="Local File" value="file" ></el-radio-button>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item v-if="method === 'url'" label="URL:">
        <el-input v-model="url" placeholder="Please input mp4 file url"></el-input>
      </el-form-item>

      <el-form-item v-if="method === 'file'"  label="File:">
        <el-upload
          ref="upload"
          class="upload-demo"
          :limit="1"
          :auto-upload="true"
          accept=".mp4,.mov"
          :before-upload="(file) => {
            files = [file]
            return false
          }"
        >
          <template #trigger>
            <el-button >Select Video</el-button>
          </template>
        </el-upload>
      </el-form-item>

      <el-form-item class="mt-10">
        <el-button type="primary" :disabled="method === 'url' ? !url : !files.length" @click="handleSubmit">Submit</el-button>
      </el-form-item>
    </el-form>
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
