# 0. 前置约定

- 对类的使用，不添加 `Cesium` 命名空间前缀，例如对于 `Viewer`，不会写 `Cesium.Viewer`，默认使用 `ESM` 格式解构导入类；
- JavaScript 代码使用最简格式（源码除外），不加分号，不用双引号，少注释，双空格缩进

## 本系列说明

佛系连载，想到什么写什么。

2022 年，写原理类的文显得非常“蠢”，大家都想吃快餐，看效果。法克鸡丝老哥的系列博客思路跳跃很快，单步说明之间的信息量很大，需要消化很长时间才能啃完一篇文章，遂决定另开一个风格，提纲挈领地把主要关键逻辑大白话说说 —— 可不是真的“大白话”，还是要有一些功底的。

我写这个，只是为了从 CesiumJS 的渲染架构中汲取一些营养，希望对自己的程序设计能力有提高，希望能从其它绘图 API 的角度看看能不能优化和实现。



# 1. 开始

很多人写 CesiumJS 程序是从 Viewer 开始的

``` js
new Viewer('container') // div id
```

你若只需要一个最干净的场景（此场景非 `Scene` 类），不需要时间条、时间控制器、右上角一堆的按钮，只需要

``` js
new CesiumWidget('container') // div id
```

CesiumJS 内置了大量的默认值，以至于简单到你可以只传递 DOM 的 id 或本身即可创建场景。

## 1.1. CesiumWidget 类是控制场景对象触发渲染的调度器

`Scene` 类是一个三维空间对象的容器，它在原型链上有一个 `render` 方法，寥寥百行，控制了三维场景中若干物体的更新、渲染。

`Scene.prototype.render` 方法调用一次，只更新并渲染一帧。

众所周知，WebGL 一般会和 `requestAnimationFrame, rAF` 这个 API 循环调用渲染函数。而让 canvas 中场景能连续多帧循环往复运行的调度者，是 `CesiumWidget` 类。

`CesiumWidget` 类有一个使用 `Object.defineProperties()` 方法定义的 `setter`：

``` js
useDefaultRenderLoop: {
  get: function () {
    return this._useDefaultRenderLoop;
  },
  set: function (value) {
    if (this._useDefaultRenderLoop !== value) {
      this._useDefaultRenderLoop = value;
      if (value && !this._renderLoopRunning) {
        startRenderLoop(this);
      }
    }
  },
}
```

在实例化 `CesiumWidget` 时，它会使用传入的值，若没有，则是 `true`：

``` js
this._useDefaultRenderLoop = undefined;
this.useDefaultRenderLoop = defaultValue(
  options.useDefaultRenderLoop,
  true
);
```

一旦赋值，就开始了 CesiumJS 的渲染循环，是一个在 **模块内** 的函数 `startRenderLoop` 负责控制的。

``` js
function startRenderLoop(widget) {
  // ... 节约篇幅，此处非源码，省略大量代码层级，有兴趣自己看源码
  function render(frameTime) {
    // ...
    widget.render()
    requestAnimationFrame(render)
    // ...
  }

  requestAnimationFrame(render)
}
```

传入的 `widget` 是 `CesiumWidget` 实例，通过 `requestAnimationFrame` 的调用，则不断地在调用这个函数内的局部函数 `render`。

`render` 函数内调用 `widget` 的 `render` 方法，再往下就是调用 `widget` 所拥有的 scene 的 render 方法了。

## 1.2. Scene 对象

接上文说。

于全局，`CesiumWidget` 负责控制 DOM 的变化情况，例如窗口尺寸变化导致 DIV 的变化等，并负责起 **渲染循环** 的调度。

于单帧，`Scene` 类则需要使用自己原型链上的 `render` 方法完成自我状态、数据对象的更新，以及 `Scene.js` 模块内的 `render` 函数触发 WebGL 绘制。

`Scene` 类是一个场景对象容器，其 `render` 方法负责：

- 生命周期事件（preUpdate、preRender、postUpdate、postRender）回调触发；
- 更新帧状态和帧号
- 更新 Scene 中的 Primitive
- 移交渲染权给模块内的 `render` 函数触发 WebGL 绘制



# 2. 三维地球哪来的？

CesiumJS 的三维地球，实际上分两大部分：

- 地球椭球体与表面的 GIS 影像服务
- 场景中的三维物体

我说过了，CesiumJS 内置了大量的默认值，包括地球椭球体以及影像服务（默认用的必应瓦片服务，要 token）。但是，实际上可以不需要地球椭球体和底图的：

``` js
  if (defined(scene.globe)) {
    scene.globe.beginFrame(frameState);
  }
```

上述代码片段是 `Scene.js` 模块内的 `render` 函数的一小段，也就是说，若没有定义 `globe`，那就不绘制椭球上的帧。

# 3. 本篇总结

综上 1、2 节，我认为 CesiumJS 的渲染循环，到本文 1.2 小节末尾提及的 `Scene.js` 模块内 `render` 函数的调用，触发 WebGL 绘制，就算一帧的逻辑结束，没有必要再向下探究 Primitive、DataSource、Globe 等数据实体的更新和渲染，也没有必要深究 WebGL 在 CesiumJS 中如何调度 —— 那都不是渲染循环的主要内容。

`Scene` 原型链上的 `render` 函数并没有更新椭球体，没有请求地形四叉树瓦片，而是等待更重要的 Primitive 等三维物体的更新后，才判断 globe 是否存在，从而决定要不要画地球（的皮肤），最终才更新并执行 `Command`，也就是 `scene.updateAndExecuteCommands(passState, backgroundColor);` 一句代码。





