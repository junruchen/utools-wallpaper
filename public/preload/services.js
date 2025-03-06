const fs = require('node:fs')
const path = require('node:path')
const { exec } = require('node:child_process')
const os = require('node:os')

// 通过 window 对象向渲染进程注入 nodejs 能力
window.services = {
  // 读文件
  readFile (file) {
    return fs.readFileSync(file, { encoding: 'utf-8' })
  },
 
  // 文本写入到下载目录
  writeTextFile (text) {
    const filePath = path.join(window.utools.getPath('downloads'), Date.now().toString() + '.txt')
    fs.writeFileSync(filePath, text, { encoding: 'utf-8' })
    return filePath
  },
  // 图片写入到下载目录
  writeImageFile (base64Url) {
    const matchs = /^data:image\/([a-z]{1,20});base64,/i.exec(base64Url)
    if (!matchs) return
    const filePath = path.join(window.utools.getPath('downloads'), Date.now().toString() + '.' + matchs[1])
    fs.writeFileSync(filePath, base64Url.substring(matchs[0].length), { encoding: 'base64' })
    return filePath
  },
  // 删除文件
  deleteFile (filePath) {
    return new Promise((resolve, reject) => {
      // 检查文件是否存在
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          // 文件不存在，直接返回成功
          resolve(true)
          return
        }

        // 检查文件权限
        fs.access(filePath, fs.constants.W_OK, (err) => {
          if (err) {
            reject(new Error('没有文件删除权限'))
            return
          }

          // 删除文件
          fs.unlink(filePath, (error) => {
            if (error) {
              reject(new Error(`删除文件失败: ${error.message}`))
            } else {
              resolve(true)
            }
          })
        })
      })
    })
  },
  // 设置壁纸
  async setWallpaper (imagePath) {
    const platform = os.platform()
    
    return new Promise((resolve, reject) => {
      let command
      
      if (platform === 'darwin') {
        // macOS
        command = `osascript -e 'tell application "System Events" to tell every desktop to set picture to "${imagePath}"'`
      } else if (platform === 'win32') {
        // Windows
        command = `powershell.exe -command "$setwallpapersrc = @'
          using System.Runtime.InteropServices;
          public class Wallpaper {
            [DllImport('user32.dll', CharSet=CharSet.Auto)]
            public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
          }
'@
          Add-Type -TypeDefinition $setwallpapersrc
          [Wallpaper]::SystemParametersInfo(0x0014, 0, '${imagePath}', 0x01 -bor 0x02)"`
      } else {
        // Linux (支持 GNOME 和 KDE)
        command = `if [ $(which gsettings) ]; then
          gsettings set org.gnome.desktop.background picture-uri-dark 'file://${imagePath}'
          gsettings set org.gnome.desktop.background picture-uri 'file://${imagePath}'
        elif [ $(which plasma-apply-wallpaperimage) ]; then
          plasma-apply-wallpaperimage '${imagePath}'
        fi`
      }
      
      exec(command, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve(true)
        }
      })
    })
  }
}
