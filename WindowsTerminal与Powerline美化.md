# 1 材料下载与资源库

需要下载、安装如下内容：

- Windows Terminal（从微软商店下载，如果打不开请把Win10代理功能关闭）
- Powershell 7（可选项，来自Github）
- 更纱黑体（英文名：Sarasa Term SC）
- Scoop 命令行工具

以下为所需的资源清单

- [Powerline主题支持的其他字体](https://github.com/powerline/fonts)
- [Windows Terminal 微软官方中文教程](https://docs.microsoft.com/zh-cn/windows/terminal/)
- 几个教程博客（关键性）
  - [Windows Terminal 完美配置 PowerShell 7.1_知乎](https://zhuanlan.zhihu.com/p/137595941) 讲了如何去除powershell的启动文本
  - [Windows Terminal安装并美化_博客园](https://www.cnblogs.com/Rohn/p/12940312.html)
  - [让Powershell用上Git_博客园](https://www.cnblogs.com/HelloMyWorld/p/4119743.html)
  - [告别 Windows 终端的难看难用，从改造 PowerShell 的外观开始_知乎](https://zhuanlan.zhihu.com/p/56808199) 讲了Console、Terminal、Shell的区别，讲了Scoop、Colortool的用法
  - [Windows 使用 FluentTerminal 搭配 Oh-My-Posh_CSDN](https://blog.csdn.net/yuanlaijike/article/details/88904695) 讲到关闭后失效问题的解决
  - [VSCode配置FiraCode和更纱黑体字体](https://www.cnblogs.com/shenyuelan/p/11963867.html) 讲到更纱黑体应该解压哪一款并附上了下载链接
  - [5 个 PowerShell 主题，让你的 Windows 终端更好看_少数派](https://sspai.com/post/52907)
  - [字体点评_知乎](https://zhuanlan.zhihu.com/p/89833093)

## 字体问题

目前知道字体带 `PL` 意味着可用于 PowerLine

如果字体带 `Code` 说明可以出现连字符



# 2 解除Powershell的安全策略问题

首先用Windows提供的默认Powershell界面，并且是管理员权限那个打开，执行：

``` powershell
Set-ExecutionPolicy Bypass
```

# 3 安装Git

git-scm.org，自己下载安装即可

# 4 安装 posh-git、posh、DirColor 以及 colortool

``` powershell
Install-Module posh-git -Scope CurrentUser 
Install-Module oh-my-posh -Scope CurrentUser
Install-Module DirColors -Scope CurrentUser
```

安装colortool先确保scoop安装准确

``` powershell
scoop install colortool
```

安装这工具使得powershell更好用：

``` powershell
Install-Module -Name PSReadLine -AllowPrerelease -Force	
```



## 4.1 colortool常用命令

暂空

# 5 设置主题

``` powershell
Set-Theme PowerLine
```

获取主题列表：

``` powershell
Get-Theme
```

如果出现日期凌乱，尝试修改为英文环境：

``` POWERSHELL
Set-Culture en-US
```

## 5.1 推荐主题

- PowerLine
- Agnoster（华丽丽的彩旗飘飘）
- Avit（两行，确保命令对齐）
- robbyrussell（来自linux）

# 6 配置 Windows Terminal

备份一个，有 powershell 7 rc1 和 cmd 和 gitbash 和 powershell 5，gitbash用了绝对路径的资源，注意。

这一步不仅是做美化，还保证了第8步启动时的当前目录准确。

用的是更纱黑体的加强补丁版：`Sarasa Mono SC Nerd`

``` JSON
{
    "$schema": "https://aka.ms/terminal-profiles-schema",
    "defaultProfile": "{574e775e-4f2a-5b96-ac1e-a2962a402336}",
    "copyOnSelect": false,
    "copyFormatting": false,
    "initialRows": 30,
    "initialCols": 120,
    "alwaysShowTabs": true,
    "showTerminalTitleInTitlebar": true,
    "experimental_showTabsInTitlebar": true,
    "profiles": {
        "defaults": {
            "startingDirectory": "./"
        },
        "list": [
            {
                "guid": "{574e775e-4f2a-5b96-ac1e-a2962a402336}",
                "hidden": false,
                "name": "Windows PowerShell 7.1 rc",
                "source": "Windows.Terminal.PowershellCore",

                "colorScheme": "Campbell",
                "fontSize": 15,
                "fontFace": "Sarasa Mono SC Nerd",
                "cursorColor": "#FFFFFF", 
                "cursorShape": "bar",
                "background": "#002731",
                "useAcrylic": true,
                "acrylicOpacity": 0.8
            },
            {
                "guid": "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}",
                "name": "Windows PowerShell",
                "commandline": "powershell.exe",
                "hidden": false,
                
                "colorScheme": "Campbell",
                "fontFace": "Sarasa Mono SC Nerd",
                "fontSize": 15,
                "cursorColor": "#FFFFFF",
                "cursorShape": "bar",
                "background": "#002731",
                "useAcrylic": true,
                "acrylicOpacity": 0.8
            },
            {
                "guid": "{0caa0dad-35be-5f56-a8ff-afceeeaa6101}",
                "name": "Windows CMD",
                "commandline": "cmd.exe",
                "hidden": false,
                
                "colorScheme": "Campbell",
                "fontSize": 15,
                "fontFace": "Sarasa Mono SC Nerd",
                "cursorColor": "#FFFFFF",
                "cursorShape": "bar",
                "background": "#131a1b",
                "useAcrylic": false,
                "acrylicOpacity": 0.8
            },
            {
                "guid": "{fd79794b-fc3a-4146-81ca-ab12613556ae}",
                "name": "Git Bash",
                "commandline": "C:\\Program Files\\Git\\git-cmd.exe",
                "hidden": false,
                "icon": "C:\\Program Files\\Git\\git.ico",  

                "colorScheme": "Campbell",
                "fontSize": 14,
                "fontFace": "Sarasa Mono SC Nerd",
                "cursorColor": "#FFFFFF",
                "cursorShape": "bar",
                "background": "#002731",
                "useAcrylic": true,
                "acrylicOpacity": 0.8
            },
            {
                "guid": "{b453ae62-4e3d-5e58-b989-0a998ec441b8}",
                "hidden": true,
                "name": "Azure Cloud Shell",
                "source": "Windows.Terminal.Azure"
            }
        ]
    },
    "schemes": [
        {
            "name": "Snazzy",
            "black": "#000000",
            "red": "#fc4346",
            "green": "#50fb7c",
            "yellow": "#f0fb8c",
            "blue": "#49baff",
            "purple": "#fc4cb4",
            "cyan": "#8be9fe",
            "white": "#ededec",
            "brightBlack": "#818181",
            "brightRed": "#fc4346",
            "brightGreen": "#50fb7c",
            "brightYellow": "#f0fb8c",
            "brightBlue": "#49baff",
            "brightPurple": "#fc4cb4",
            "brightCyan": "#8be9fe",
            "brightWhite": "#ededec",
            "background": "#1e1f29",
            "foreground": "#ebece6"
        },
        {
            "name": "Campbell",
            "foreground": "#A7B191",
            "background": "#0C0C0C",
            "colors": [
                "#0C0C0C",
                "#C50F1F",
                "#13A10E",
                "#C19C00",
                "#0037DA",
                "#881798",
                "#3A96DD",
                "#CCCCCC",
                "#767676",
                "#E74856",
                "#16C60C",
                "#F9F1A5",
                "#3B78FF",
                "#B4009E",
                "#61D6D6",
                "#F2F2F2"
            ]
        },
        {
            "name": "Solarized Dark",
            "foreground": "#FDF6E3",
            "background": "#073642",
            "colors": [
                "#073642",
                "#D30102",
                "#859900",
                "#B58900",
                "#268BD2",
                "#D33682",
                "#2AA198",
                "#EEE8D5",
                "#002B36",
                "#CB4B16",
                "#586E75",
                "#657B83",
                "#839496",
                "#6C71C4",
                "#93A1A1",
                "#FDF6E3"
            ]
        },
        {
            "name": "Solarized Light",
            "foreground": "#073642",
            "background": "#FDF6E3",
            "colors": [
                "#073642",
                "#D30102",
                "#859900",
                "#B58900",
                "#268BD2",
                "#D33682",
                "#2AA198",
                "#EEE8D5",
                "#002B36",
                "#CB4B16",
                "#586E75",
                "#657B83",
                "#839496",
                "#6C71C4",
                "#93A1A1",
                "#FDF6E3"
            ]
        }
    ],
    "actions": [
        {
            "command": {
                "action": "copy",
                "singleLine": false
            },
            "keys": "ctrl+c"
        },
        {
            "command": "paste",
            "keys": "ctrl+v"
        },
        {
            "command": "find",
            "keys": "ctrl+shift+f"
        },
        {
            "command": {
                "action": "splitPane",
                "split": "auto",
                "splitMode": "duplicate"
            },
            "keys": "alt+shift+d"
        }
    ]
}
```

字体在Github上可以搜到。

# 7 修改powershell的配置文件

查看当前powershell的配置文件：

``` powershell
# 查看路径
echo $profile
# 在命令行显示其内容
cat $profile
# 或者直接打开编辑
notepad $profile
```

内容如下：

``` powershell
#region conda initialize
# !! Contents within this block are managed by 'conda init' !!
# (& "C:\Users\CDCI\miniconda3\Scripts\conda.exe" "shell.powershell" "hook") | Out-String | Invoke-Expression
#endregion

Import-Module posh-git
Import-Module oh-my-posh
Import-Module DirColors
Set-Theme PowerLine
```

最后一行是设置主题，自己想修改啥样就改一下

# 8 为右键菜单添加“使用 Windows Powershell 打开”

写个注册表项

``` 
Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\Directory\Background\shell\wt]
@="使用 Windows Terminal 打开"
"Icon"="%USERPROFILE%\\AppData\\Local\\Terminal\\terminal.ico"

[HKEY_CLASSES_ROOT\Directory\Background\shell\wt\command]
@="C:\\Users\\CDCI\\AppData\\Local\\Microsoft\\WindowsApps\\wt.exe"
```

可执行文件和图标自己网上找，挺多的，写对路径即可