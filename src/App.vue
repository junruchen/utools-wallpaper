<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import Wallpaper from './components/Wallpaper/index.vue'

const route = ref('')
const enterAction = ref({})

onMounted(() => {
  window.utools.onPluginEnter((action) => {
    route.value = action.code
    enterAction.value = action
  })
  window.utools.onPluginOut((isKill) => {
    route.value = ''
  })
})
</script>

<template>
  <Wallpaper :enterAction="enterAction"></Wallpaper>
</template>
