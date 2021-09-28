PowerShell 要编辑 `$profile` 文件

```  sh
notepad $profile
```

使用 `Set-Theme` 设置主题（提示文字的样式），使用 `colortool` 设置文字颜色、光标颜色等。

PowerShell 这个配置文件的主题到处有效，但是 `colortool` 设置的颜色在 WindowsTerminal 中不一定有效，因为 WindowsTerminal 需要自己配置自己的颜色。

- PowerShell 所用的颜色，可以是 `.itermcolors` 文件，从这里获取：https://iterm2colorschemes.com/，粘贴到 `colortools -l` 所在的文件夹即可；
- WindowsTerminal 所用的颜色是一个 JSON，写在其配置文件中 `schemas` 数组里，从这里获取：https://github.com/mbadolato/iTerm2-Color-Schemes/tree/master/windowsterminal

