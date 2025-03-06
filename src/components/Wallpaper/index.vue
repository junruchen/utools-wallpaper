<script lang="ts" setup>
import { reactive, onMounted, onUnmounted, nextTick } from 'vue'
import p5 from 'p5'
import waves from './waves.jsx'
import getRandomColor from './getRandomColor'
import loadPoem from './loadPoem.js'
import { INTERVAL_OPTIONS } from './config'

// 状态管理
const poemData =  reactive({
  content: '',
  author: '',
  title: ''
})
const wallpaperParams = reactive({
  waveColor: '',
  isDarkMode: true,
  changeInterval: 60
})

let p5Instance = null
let autoChangeTimer = null

// 壁纸相关方法
const wallpaperMethods = {
  // 获取本地缓存配置
  loadSettings() {
    const settings = window.utools.dbStorage.getItem('wallpaper-settings-n')
    if (settings) {
      wallpaperParams.changeInterval = settings.changeInterval
      wallpaperParams.isDarkMode = settings.isDarkMode
      wallpaperParams.waveColor = settings.waveColor
    }
  },
  // 保存设置到本地存储
  saveSettings() {
    window.utools.dbStorage.setItem('wallpaper-settings-n', {
      changeInterval: wallpaperParams.changeInterval,
      isDarkMode: wallpaperParams.isDarkMode,
      waveColor: wallpaperParams.waveColor ? {
        name: wallpaperParams.waveColor.name,
        color: wallpaperParams.waveColor.color
      } : null
    })
  },
  // 获取诗词
  fetchPoem () {
    loadPoem(
      (result) => {
        poemData.content = result.data.content
        poemData.author = result.data.origin.author
        poemData.title = result.data.origin.title
        updateP5Instance()
      }
    );
  },
  stopAutoChange () {
    if (autoChangeTimer) {
      clearInterval(autoChangeTimer)
      autoChangeTimer = null
    }
  },
  startAutoChange () {
    wallpaperMethods.stopAutoChange()

    const interval = wallpaperParams.changeInterval
    const milliseconds = interval < 1 ? interval * 60 * 1000 : interval * 60 * 1000

    autoChangeTimer = setInterval(async () => {
      try {
        // 更新诗词
        wallpaperParams.waveColor = getRandomColor(wallpaperParams.isDarkMode)
        await wallpaperMethods.fetchPoem()
        
        // 给予足够的时间让p5实例完成渲染
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 设置壁纸
        await setWallpaper()
      } catch (error) {
        window.utools.showNotification('自动更新壁纸失败')
      }
    }, milliseconds)
  }
}

// 参数变化函数
const changeMethods = {
  // 更换背景色
  onChangeTheme () {
    wallpaperParams.isDarkMode = !wallpaperParams.isDarkMode
    updateP5Instance()
    wallpaperMethods.saveSettings()
  },

  // 更换波浪颜色
  onChangeWavecolor () {
    wallpaperParams.waveColor = getRandomColor(wallpaperParams.isDarkMode)
    wallpaperMethods.saveSettings()
    updateP5Instance()
  },

  // 更换间隔
  onChangeInterval (value) {
    wallpaperParams.changeInterval = value

    if (value > 0) {
      wallpaperMethods.startAutoChange()
    } else {
      wallpaperMethods.stopAutoChange()
    }
    wallpaperMethods.saveSettings()
  }
}

// 更新实例
function updateP5Instance () {
  if (!p5Instance) return
  if (!wallpaperParams.waveColor) {
    wallpaperParams.waveColor = getRandomColor(wallpaperParams.isDarkMode)
  }
  
  p5Instance.updateWithProps({
    isDarkMode: wallpaperParams.isDarkMode,
    waveColor: wallpaperParams.waveColor,
    poem: poemData
  })
}

// 设置电脑壁纸
async function setWallpaper () {
  try {
    // 确保字体加载完成
    await document.fonts.ready
    
    // 创建壁纸画布并获取数据 URL
    const dataUrl = await p5Instance.createWallpaperCanvas()
    if (!dataUrl) throw new Error('无法创建壁纸画布')
    
    // 保存壁纸
    const imagePath = window.services.writeImageFile(dataUrl)
    if (!imagePath) throw new Error('无法保存壁纸图片')
    
    // 设置壁纸
    await window.services.setWallpaper(imagePath)

    // 删除临时文件
    try {
      await window.services.deleteFile(imagePath)
    } catch (deleteError) {
      console.error('删除临时文件失败：', deleteError)
    }
    
    window.utools.showNotification('壁纸设置成功')
  } catch (error) {
    console.error('设置壁纸失败：', error)
    window.utools.showNotification(error.message || '设置壁纸失败')
  }
}

// 组件挂载时启动自动更换
wallpaperMethods.loadSettings() // 获取默认配置
wallpaperMethods.fetchPoem() // 获取诗词

onMounted(() => {
  nextTick(() => {
    const container = document.getElementById('waves-container')
    if (!container) return
    
    p5Instance = new p5((p) => {
      waves(p)
      updateP5Instance()
    }, container)

    // 如果设置了自动更换间隔，启动自动更换
    if (wallpaperParams.changeInterval > 0) {
      wallpaperMethods.startAutoChange()
    }
  })
})

// 组件卸载时清理定时器
onUnmounted(() => {
  wallpaperMethods.stopAutoChange()
  if (p5Instance) {
    p5Instance.remove()
  }
})
</script>

<template>
  <div class="wallpaper">
    <div class="settings">
      <button class="set-button refresh-button" @click="wallpaperMethods.fetchPoem">诗词切换</button>
      <button class="set-button refresh-button" @click="changeMethods.onChangeWavecolor">颜色切换</button>
      <button class="set-button" @click="changeMethods.onChangeTheme">{{ wallpaperParams.isDarkMode ? '更换浅色背景' : '更换深色背景' }}</button>
      <button class="set-button" @click="setWallpaper">设置为电脑壁纸</button>
      <div class="interval-setting">
        自动更换壁纸间隔：
        <select
          :value="wallpaperParams.changeInterval"
          @change="e => changeMethods.onChangeInterval(Number(e.target.value))"
          class="interval-select"
        >
          <option v-for="option in INTERVAL_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>
    <div class="preview" :style="{ backgroundColor: wallpaperParams.isDarkMode ? '#323232' : '#e6e6e6' }">
      <div id="waves-container" class="waves-container"></div>
    </div>
  </div>
</template>

<style>
.wallpaper {
  height: calc(100vh - 30px);
  display: flex;
  flex-direction: column;
  padding: 10px 20px 20px;
}

.settings {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  justify-content: space-between;
}

.interval-setting {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}

.set-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #4a4a4a;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.set-button:hover {
  background-color: #666;
}

.interval-select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #4a4a4a;
  color: white;
  cursor: pointer;
}

.interval-input {
  width: 60px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #4a4a4a;
  color: white;
}

.interval-label {
  color: #fff;
}

.preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  color: white;
  position: relative;
  overflow: hidden;
}

.waves-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>