介绍几种开项目的方法

# 0. 前置步骤 - 获取 CesiumJS 的方式

CesiumJS 是可以离线使用的。官方 ion 提供了地图瓦片服务和高程地形服务，这些均可自行架设替代。

浏览器页面获取 CesiumJS 有两种方式：

- CDN 连接
- 随项目一起发布本地/局域网 Cesium.js 相关文件

其中，后面一种可以是从官方发布的压缩包中获取，有压缩版或非压缩版两种；也可以由当下火热的工程化前端项目的打包器（Webpack、Rollup、Parcel、Esbuild等）打包、分发。

## 0.1. 打包器打包的弊端

打包器打包 Cesium.js 后，会随业务代码一起封进 js 文件中，经丑化压缩后几乎不可读。

而且打包器对库程序的打包，尤其是静态的库，像 CesiumJS 就是十分典型的静态库，而且十分庞大（未压缩的模块源码合并成单文件，有 30 多万行），是十分消耗时间的。

通常打包器都会有类似 `external` 的选项将这类静态库外置出去，只打包业务代码。



## 0.2. 静态资源文件

CesiumJS 除了 `Cesium.js` 库文件本身、`widget.css` 样式文件外，还有一些网络工作器（WebWorker）、网络程序集（WebAssembly）二进制文件等 **静态资源** 需要访问，这些是不参与打包器打包的，而且需要与全局的 `CESIUM_BASE_URL` 路径相对正确，才能正常运行 CesiumJS 程序。

CesiumJS 用四大文件夹来存放必要的静态资源文件：

- `Assets`
- `ThirdParty`
- `Widgets`
- `Workers`

与这四大文件夹同级别的，有一个 `Cesium.js` 入口文件（ESM源码）或库文件（打包成 UMD 格式后），一个类型定义 `Cesium.d.ts` 文件，以及源代码映射文件 `Cesium.js.map`。



## 0.3. 你需要 HTTP 环境

现在在你的开发机器上启动 HTTP 服务器访问开发中的 html 页面，已经非常简单了。

CesiumJS 是不能双击打开 `html` 页面访问的，双击 html 页面，使用的是 `file://` 协议；必须使用 `http(s)://` 协议访问页面。

你可以使用 Web 服务器程序伺服你的页面程序：

- nginx
- tomcat

当然，上面那俩对新手来说还是太麻烦了，那俩更合适生产环境。

新手还可以借助 IDE/编辑器插件，把某个 **文件夹** 作为根路径伺服为一个 HTTP 地址。常用的，以 VSCode 为例，可以用 `Live Server` 插件完成（怎么用自己搜索）。

也可以使用 `python` 的 http 模块启动，或者使用 npm 全局可执行程序包开一个 HTTP 服务器。



# 方案① 开发初学者适用

以 VSCode 的 LiveServer 插件为例，使用默认访问端口 5500。

## 使用单 html 文件与 CDN 导入

使用非常简单的 `html` 文件，甚至都不需要遵循 HTML5 规范。

``` html
<script src="https://cdn.bootcdn.net/ajax/libs/cesium/1.92.0/Cesium.js"></script>
<link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/cesium/1.92.0/Widgets/widgets.css" />
<style>
  * {
    padding: 0;
    margin: 0;
  }
  #container {
    width: 100vw;
    height: 100vh;
  }
</style>
<div id="container"></div>

<script>
  new Cesium.Viewer('container')
</script>
```

## 使用源代码（ES 模块）写程序

这个方法需要你下载官方的 `Cesium-1.XX.zip`（推荐最新版），也就是打包好的分发包，解压后你应该会在根目录下找到 `Source` 文件夹，**拷贝整个文件夹到你的工程文件夹下，使得 `index.html` 与 `Source` 文件夹同级**。

修改代码：

``` html
<script type="importmap">
{
  "imports": {
    "cesium": "./Source/Cesium.js"
  }
}
</script>
<link rel="stylesheet" href="./Source/Widgets/widgets.css" />
<style>
  * {
    padding: 0;
    margin: 0;
  }
  #container {
    width: 100vw;
    height: 100vh;
  }
</style>
<div id="container"></div>

<script type="module">
  import { Viewer } from 'cesium'

  window.CESIUM_BASE_URL = './Source/'

  new Viewer('container')
</script>
```

使用源代码开发时，需要指定 `CESIUM_BASE_URL`，也就是 `Cesium.js` 这个入口文件的 HTTP 路径相对地址。

以 VSCode 的 LiveServer 插件和上述代码为例，当我们访问 `http://localhost:5500/Source/Cesium.js` 时，应该能正确访问到入口文件。

`http://localhost:5500/` 就相当于是项目根目录，`http://localhost:5500/Source/` 就相当于是项目根目录下的 `Source/` 文件夹。

## 提示

你可以把 JavaScript 代码、样式代码分离到单独的文件，不赘述。

## 提示②

你可以省去一个 `link` 标签：

``` diff
- <link rel="stylesheet" href="./Source/Widgets/widgets.css" />
<style>
+  @import url(./Source/Widgets/widgets.css);
...
```



# 方案② 在打包器中使用 - 随依赖发布法

假定 node 包管理工具使用 `pnpm`，你也可以用 `npm`、`yarn`。那么在你的项目包中安装 `cesium`：

``` sh
pnpm add -D cesium
```

注意！这个命令运行后会安装最新版，且以后都会安装当前版本以上的最新版，若为长期生产项目，建议直接指定版本，这样就不会有版本问题了：

``` sh
pnpm add -D cesium@1.92.0
```

> 为什么要作为开发依赖（devDependencies）安装呢？
>
> 原因有三：
>
> - `cesium` 包不参与打包
> - `CesiumJS` 的库文件和静态资源文件均复制到了 `public/` 文件夹下，并设置了 `CESIUM_BASE_URL`，也即使用外部库的方式加载 CesiumJS
> - 项目一般是 App，而不是 Library 发布到 [npmjs.com](https://www.npmjs.com/)，所以没必要放在依赖项中，放在开发依赖就可以

## 环境说明

使用的打包环境是：

- Vite 2.9 及以上

使用 Webpack 的框架在文末会补充。

前端环境是：

- Chrome 最新正式版（发文时，版本为 100）
- 使用原生 JavaScript / Vue3.2 / React 18 三套模板

## 大致逻辑

主要是复制上文 **静态资源文件** 小节提及的，来自 `Build/Cesium` 或 `Build/CesiumUnminified` 文件夹下的 **四大文件夹** 以及 `Cesium.js` 库文件。

工程依赖安装完毕后，包管理器会自动拉起 `postinstall` 命令，运行一个 nodejs 脚本 —— 先删除工程根目录下 `public/` 文件夹内旧的静态资源文件 —— 然后复制上文提及的 **静态资源文件** 到工程根目录下的 `public/` 文件夹内。

随着项目的启动，Vite 配置文件会忽略源代码中导入的 `cesium` 包，并使用外置库来加载 CesiumJS 库以及静态资源。

而对于 Vite 的打包，`public/` 文件夹内的 CesiumJS 库文件、静态资源就随项目一起发布了。

## 示例工程文件

由于前端项目是多文件构成，所以不再在文中详尽列举，请按大致逻辑自行了解。

GitHub 连接：[openspacing/cesium-vite-template](https://github.com/openspacing/cesium-vite-template)



# 方案③ 在打包器中使用 - 直接使用 CDN 连接

## 大致逻辑

这个方法就是方案② 的简化，去除不必要的 `postinstall` 处理过程，只需让 Vite 等打包器忽略源码中导入的 `cesium` 包即可，并使用 CesiumJS CDN 连接替换原来配置的随项目发布后的本地文件相对连接。

## 示例工程文件

TODO