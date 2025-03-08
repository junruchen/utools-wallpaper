// 在Windows系统上设置桌面壁纸
// 引入必要的命名空间
using System;
using System.Runtime.InteropServices;
using Microsoft.Win32;

// Wallpaper命名空间，包含设置Windows桌面壁纸的功能
namespace Wallpaper
{
    /// <summary>
    /// 壁纸设置器类，提供设置Windows桌面壁纸的功能
    /// </summary>
    public class Setter {
        /// <summary>
        /// Windows API常量：设置桌面壁纸的操作代码 (0x0014)
        /// </summary>
        public const int    SetDesktopWallpaper    = 20;
        
        /// <summary>
        /// Windows API常量：更新系统INI文件的标志
        /// </summary>
        public const int    UpdateIniFile        = 0x01;
        
        /// <summary>
        /// Windows API常量：发送WM_SETTINGCHANGE消息通知系统设置已更改
        /// </summary>
        public const int    SendWinIniChange    = 0x02;
        
        /// <summary>
        /// 导入user32.dll中的SystemParametersInfo函数
        /// 该函数用于查询或设置系统级参数，包括桌面壁纸
        /// </summary>
        /// <param name="uAction">要执行的操作代码</param>
        /// <param name="uParam">操作特定的参数，设置壁纸时为0</param>
        /// <param name="lpvParam">指向操作特定数据的指针，设置壁纸时为壁纸文件路径</param>
        /// <param name="fuWinIni">系统设置更新标志</param>
        /// <returns>操作成功返回非零值，失败返回零</returns>
        [DllImport( "user32.dll", SetLastError = true, CharSet = CharSet.Auto )]
        private static extern int SystemParametersInfo( int uAction, int uParam, string lpvParam, int fuWinIni );

        /// <summary>
        /// 设置Windows桌面壁纸
        /// </summary>
        /// <param name="path">壁纸图片的完整路径</param>
        /// <remarks>
        /// 此方法调用Windows API设置桌面壁纸，并确保更新系统设置并通知其他应用程序
        /// 壁纸图片必须是系统支持的格式（如JPG、PNG等）
        /// </remarks>
        public static void SetWallpaper( string path )
        {
            SystemParametersInfo( SetDesktopWallpaper, 0, path, UpdateIniFile | SendWinIniChange );
        }
    }
}