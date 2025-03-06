import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // build: {
  //   rollupOptions: {
  //     output: {
  //       assetFileNames: (assetInfo) => {
  //         const info = assetInfo.name.split('.')
  //         const ext = info.pop()
  //         const name = info.join('.')
  //         if (name === 'gif.worker') {
  //           return '[name][extname]'
  //         }
  //         return 'assets/[name]-[hash][extname]'
  //       }
  //     }
  //   }
  // }
})
