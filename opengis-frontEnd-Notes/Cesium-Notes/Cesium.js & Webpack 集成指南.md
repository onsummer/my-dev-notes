Cesium.js & Webpack 集成指南

CesiumJS 是一个大且复杂的库。不仅包括 JavaScript 模块，还包括 CSS/图像/JSON 文件等静态资源。它还包括 WebWorker 来开辟线程进行密集计算。

与传统的 npm 包不同，CesiumJS 没有定义包的入口点，因为这个库的用途多种多样，需要在 Webpack 中额外做一些配置才能正确使用它。



首先，定义 CesiumJS 在哪。本教程用的是源代码，所以 Webpack 可以追踪依赖。或者，你也可以使用 CesiumJS 的构建版本（最小化或未最小化两个版本）。但是构建版本的模块已经组合或者优化过了，灵活性较差。



在 `webpack.config.js` 文件顶部加两行代码：

``` js
// 指向 CesiumJS 源代码的路径
const cesiumSource = 'node_modules/cesium/Source'
const cesiumWorkers = '../Build/Cesium/Workers'
```







添加 `cesium` 别名以便于在代码中能获取 Cesium 的引用。

``` js
resolve: {
  alias: {
    cesium: path.resolve(__dirname, cesiumSource)
  }
}
```

这样，当你导入 `node_modules/cesium/Source/Core/Color.js` 时，可以这么导入：

``` js
// 未使用 alias
import Color from 'node_modules/cesium/Source/Core/Color.js'

// 使用 alias 后
import Color from 'cesium/Core/Color.js'
```

> 关于 Webpack 的 alias，可参考：[resolve.alias](https://webpack.docschina.org/configuration/resolve/#resolvealias)



# 管理 CesiumJS 静态文件

最后，确保 CesiumJS 静态资源伺服和加载正常。

使用 [copy-webpack-plugin](https://github.com/webpack-contrib/copy-webpack-plugin) 插件在 build 结束后将复制静态资源至 dist 目录。

``` sh
npm install copy-webpack-plugin -D
```

在 `webpack.config.js` 文件中导入它：

``` js
import CopyWebpackPlugin from 'copy-webpack-plugin'
```

然后将其添加到配置项的 `plugins` 数组中：

``` js
plugins: [
  new HtmlWebpackPlugin({ /* ... */ }),
  new CopyWebpackPlugin({
    patterns: [
      { from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' },
      { from: path.join(cesiumSource, 'Assets'), to: 'Assets' },
      { from: path.join(cesiumSource, 'Widgets'), to: 'Widgets' }
    ]
  })
]
```

这样就能把 `Assets`、`Widgets` 目录以及构建好的 WebWorker 脚本复制到 `dist/` 下对应的 `to` 目录了。

