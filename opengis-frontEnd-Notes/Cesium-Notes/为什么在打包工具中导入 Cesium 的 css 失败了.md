为何在打包工具中导入 Cesium 的 css 失败了？

# 1 问题起因

我使用 `vite2 + vanillajs` 模板创建 CesiumJS 项目，其中，main.js 是这样的：

``` js
import { Viewer } from 'cesium'
import './style.css'
import 'cesium/Source/Widgets/widgets.css'

let viewer
const main = () => {
  const dom = document.getElementById('app')
  viewer = new Viewer(dom)
}

document.addEventListener('DOMContentLoaded', () => {
  main()
})
```

看起来逻辑完美，思路清晰，没什么特别的疑问点。于是我就吭哧吭哧地运行起 npm script：

``` bash
pnpm dev
```

可是，Vite 在控制台给我报了个错：

```bash
[vite] Internal server error: Missing "./Source/Widgets/widgets.css" export in "cesium" package
```

>  这个问题貌似在各前端框架的模板中是不会出现的，我不确定。也有人在 Webpack 中遇到了这个类似的情况，究其原因，我认为还是 cesium 包的导出有些不完备，见下面第二节的分析。

简单点说，就是 Vite 的内置预构建工具 esbuild 在搜索依赖树时，没有找到 `"cesium"` 包导出的一个路径为 `"./Source/Widgets/widgets.css"` 文件。

# 2 寻找解决方案

可是，当我打开 `node_modules/cesium/Source/Widgets/` 目录，`widgets.css` 文件的确就在那里放着。

于是我打开了谷歌，果不其然找到了类似的 issue：[github.com/CesiumGS/cesium issue#9212](https://github.com/CesiumGS/cesium/issues/9212)，我在 2021 年 8 月也跟帖回复了我的情况。

我当时并没有找到解决方案，就暂时跳过了。

后来，有外国朋友跟帖回复，大致原因找到了：

`cesium` 包的 `package.json` 没有导出样式文件，主要是 `package.json` 中的 `exports` 属性。

于是，我打开官方源码的 `package.json`，找到对应的部分：

``` json
{
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "require": "./index.cjs",
      "import": "./Source/Cesium.js"
    }
  }
}
```

## 2.1. 历史原因

众所周知，NodeJS 最先使用的模块化机制是 CommonJS，后来才支持的 ESModule，现在 NodeJS 仍然默认新建的包是 CommonJS 模块的。

外国佬在 NodeJS 的包中允许双模块化，这就容易存在兼容性问题。我们看看最开始是怎么实现双模块化的，这里以默认 ESModule 为模块化方式：

- 设置 `package.json` 的 `"type": "module"`，这样所有的 `.js` 文件都是 ESM 了
- 设置 `package.json` 的 `"module": "./dist/esm/index.js"`，这个意思是使用 import 语法导入时，ESM 模块将从哪里寻找主文件
- 设置 `package.json` 的 `"main": "./index.cjs"`，这个意思是使用 require 函数导入模块时，CommonJS 的主文件是哪个

后来，随着 ESModule 成为主流标准，NodeJS 改进了上面的配置方式，你仍可以设置 `"type": "module"` 令当前包的模块化是 ESM，但是对包的多模块化机制的配置则改用了 `"exports"` 字段，正如上面 cesium 的配置。

我检查了我的 NodeJS 版本：

``` bash
> node -v
> v16.14.0
```

显然比较新，那么它应该就是从 `"exports"` 中读取的导出信息。

## 2.2. 增加导出

于是，我增加了 `"exports"` 的导出字段，让打包工具在识别 cesium 包的导出时，可以正确识别 `widgets.css` 文件。

``` diff
{
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "require": "./index.cjs",
      "import": "./Source/Cesium.js"
    },
+   "./Source/Widgets/widgets.css": "./Source/Widgets/widgets.css"
  }
}
```

这样，下面两个导入语句：

``` js
import { Viewer } from 'cesium'
import 'cesium/Source/Widgets/widgets.css'
```

实际上就是：

``` js
import { Viewer } from 'cesium/Source/Cesium.js'
import 'cesium/Source/Widgets/widgets.css'
```

## 2.3. 耍个花招

我觉得这样导入 css 文件还是太长，不妨在 `"exports"` 中给它改个名：

``` diff
{
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "require": "./index.cjs",
      "import": "./Source/Cesium.js"
    },
+   "./index.css": "./Source/Widgets/widgets.css"
  }
}
```

然后就可以愉快地使用短路径导入了：

``` js
import { Viewer } from 'cesium'
import 'cesium/index.css'
```

事实上，`package.json` 中的这个 `exports` 属性，就起到类似导出别名的作用，其中 `"."` 就相当于包的根路径。



# 3 类型提示是哪来的

考虑这样导入 cesium 各个 API：

``` js
import {
  Viewer,
  Cartesian3,
  Camera
} from 'cesium'
```

当你使用这些类的时候，会得到不错的类型提示。回顾前面的内容，其实从 `"cesium"` 导入子模块，实际上是从 `"cesium/Source/Cesium.js"` 文件导入的，而这个文件的旁边就有一个 `"Cesium.d.ts"` 文件，它就起类型提示的作用。

> 这个类型声明文件是 Cesium 使用 gulp 打包时输出的。



---

说了这么多，根本原因还是 JavaScript 的历史包袱导致的各种问题，而且官方也暂时没有修改 package.json 中 exports 的计划，如果你有报这个错误，那么你仅仅需要按我上面的方式稍作修改即可。