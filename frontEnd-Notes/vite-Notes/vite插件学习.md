# 1. 资源压缩类

## ① vite-imagetools 压缩图片

https://github.com/JonasKruckenberg/vite-imagetools

可以方便的在标签后面接 `?参数` 或在 import 图片时接参数，以达到修改图片尺寸、压缩图片、转图片格式等功能

## ② vite-plugin-compress 压缩静态资源

使用 Brotli、svgo、imagemin 等工具压缩 \<root\>/public 目录下的资源。

## ③ vite-plugin-imagemin 有中文 压缩图片

配置略多，以配置式（①是指令式）压缩图片。①还有别的功能。



# 2. 主题

## ① vite-plugin-theme 有中文

https://github.com/anncwb/vite-plugin-theme 

用于动态更改界面主题色的 vite 插件。

在 vite 处理 css 后,动态解析 css 文本内符合插件配置的颜色值的时候,从所有输出的 css 文件提取指定的颜色样式代码。并创建一个仅包含颜色样式的`app-theme-style.css`文件，动态插入到指定的位置(默认 body 底部),然后将所使用的自定义样式/组件库样式颜色替换为新的颜色,以达到动态更改项目主题色的目的

## ② vite-plugin-fonts

字体支持。





# 3. 配置丰富

## ① vite-tsconfig-paths

直接借用 ts 的路径配置，包括 root、extensions 的路径。

## ② vite-plugin-html 有中文

压缩和注入 html，注入就是模板化。

## ③ vite-plugin-importer

集成了 `babel-plugin-import` 插件，可以导入更多的插件了。

## ④ vite-plugin-style-import 有中文

该插件可按需导入组件库样式，注意是样式。ui组件已经是按需导入的了，但是样式不是。用这个插件可以完成。

https://github.com/anncwb/vite-plugin-style-import

## ⑤ vite-plugin-rsw 有中文

大名鼎鼎的 Rust WebAssembly 支持。需要预先安装：

- rust
- nodejs
- wasm-pack

## ⑥ vite-plugin-banner 有中文

https://github.com/chengpeiquan/vite-plugin-banner

给每个打包文件的头部加个注释广告用的



# 4. 其他 

## ① vite-plugin-node

将 vite 用作后台开发的开发服务器，使得nodejs开发有热更新等强大功能。

现在，已经支持 nest、express。（2021年3月5日）

## ② vite-eslint

不一定谁都需要语法检查的，这个不是必备插件。

## ③ vite-plugin-mpa

多页面插件



# 5. 测试

## ① vite-plugin-test

测试插件

## ② vite-plugin-mock 有中文

提供本地和生产模拟服务。并同时支持本地环境和生产环境。