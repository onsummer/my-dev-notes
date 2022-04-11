CesiumJS 2022^ 原理[2] 执行绘制指令

---

# 回顾

书接上文，`Scene.js` 模块内的 `render` 函数会将控制权交给 WebGL，执行 CesiumJS 自己封装的指令对象，画出每一帧来。

模块内的 `render` 函数首先会更新一批状态信息，譬如帧状态、雾效、Uniform 值、通道状态、三维场景中的环境信息等，然后就开始更新并执行指令，调用的是 `Scene` 原型链上的 `updateAndExecuteCommands` 方法。

整个过程大致的调用链是这样的（`function` 关键字简写为 `fn`）：

```
[Module Scene.js]
- fn render()
  - Scene.prototype.updateAndExecuteCommands()
    - fn executeCommandsInViewport()
      - fn updateAndRenderPrimitives()
          [Module Primitive.js]
          - fn createCommands()
          - fn updateAndQueueCommands()
      - fn executeCommands()
     	- fn executeCommand()
```

本篇讲解的是从 `Scene ` 原型链上的 `updateAndExcuteCommands()` 方法开始，期间 Scene 中的 Primitives 是如何创建指令，又最终如何被 WebGL 执行的。

这个过程涉及非常多细节代码，但是为了快速聚焦整个过程，本篇先介绍两个 CesiumJS 封装的概念：指令和通道。

## 预备知识：指令

WebGL 是一种依赖于“全局状态”的绘图 API，面向对象特征比较弱，为了修改全局状态上的顶点数据、着色器程序、帧缓冲、纹理等“资源”，必须通过 `gl.XXX` 函数调用触发全局状态的改变。

而图形编程基础提出的渲染管线、通道等概念偏向于面向对象，显然 WebGL 这种偏过程的风格需要被 JavaScript 运行时引擎封装。

CesiumJS 将 WebGL 的绘制过程，也就是行为，封装成了“指令”，不同的指令对象有不同的用途。指令对象保存的行为，具体就是指由 Primitive 对象（不一定全是 Primitive）生成的 WebGL 所需的数据资源（缓冲、纹理、唯一值等），以及着色器对象。数据资源和着色器对象仍然是 CesiumJS 封装的对象，而不是 WebGL 原生的对象，这是为了更好地与 CesiumJS 各种对象结合去绘图。

CesiumJS 有三类指令：

- `DrawCommand` 绘图指令
- `ClearCommand` 清屏指令
- `ComputeCommand` 计算指令

绘图指令最终会把控制权交给 `Context` 对象，根据自身的着色器对象，绘制自己身上的数据资源。

清屏指令比较简单，目的就是调用 WebGL 的清屏函数，清空各类缓冲区并填充清空后的颜色值，依旧会把控制权传递给 `Context` 对象。

计算指令则借助 WebGL 并行计算的特点，将指令对象上的数据在着色器中编码、计算、解码，最后写入到输出缓冲（通常是帧缓冲的纹理上），同样控制权会给到 `Context` 对象。



## 预备知识：通道

一帧是由多个通道顺序绘制构成的，在 CesiumJS 中，通道英文单词是 `Pass`。

既然通道的绘制是有顺序的，其顺序保存在 `Renderer/Pass.js` 模块导出的冻结对象中，目前（1.92版本）有 10 个优先顺序等级：

``` js
const Pass = {
  ENVIRONMENT: 0,
  COMPUTE: 1,
  GLOBE: 2,
  TERRAIN_CLASSIFICATION: 3,
  CESIUM_3D_TILE: 4,
  CESIUM_3D_TILE_CLASSIFICATION: 5,
  CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW: 6,
  OPAQUE: 7,
  TRANSLUCENT: 8,
  OVERLAY: 9,
  NUMBER_OF_PASSES: 10,
}
```

以上为例，第一优先被绘制的指令，是环境（`ENVIRONMENT: 0`）方面的对象、物体。而不透明（`OPAQUE: 7`）的三维对象的绘制指令，则要先于透明（`TRANSLUCENT: 8`）物体被执行。

CesiumJS 会在每一帧即将开始绘制前，对所有已经收集好的指令根据通道进行排序，实现顺序绘制，下文会细谈。



# 1. 生成并执行指令

原型链上的 `updateAndExecuteCommands` 方法会做模式判断，我们一般使用的是三维模式（`SceneMode.SCENE3D`），所以只需要看 `else if` 分支即可，也就是

``` js
executeCommandsInViewport(true, this, passState, backgroundColor);
```

此处，`this` 就是 `Scene` 自己。

`executeCommandsInViewport()` 是一个 `Scene.js` 模块内的函数，这个函数比较短，对于当前我们关心的东西，只需要看它调用的 `updateAndRenderPrimitives()` 和最后的 `executeCommands()` 函数调用即可。

## 1.1. Primitive 生成指令

``` 
[Module Scene.js]
- fn updateAndRenderPrimitives()
  [Module Primitive.js]
  - fn createCommands()
  - fn updateAndQueueCommands()
```

`Scene.js` 模块内的函数 `updateAndRenderPrimitives()` 负责更新 Scene 上所有的 Primitive。

期间，控制权会通过 `PrimitiveCollection` 转移到 `Primitive` 类（或者有类似结构的类，譬如 `Cesium3DTileset` 等）上，令其更新本身的数据资源，根据情况创建新的着色器，并随之创建 **绘图指令**，最终在 `Primitive.js` 模块内的 `updateAndQueueCommands()` 函数排序、并推入帧状态对象的指令列表上。



## 1.2. Context 对象负责执行 WebGL 底层代码

``` 
[Module Scene.js]
- fn executeCommands()
- fn executeCommand() // 收到 Command 和 Context
  [Module Context.js]
  - Context.prototype.draw()
```



另一个模块内的函数 `executeCommands()` 则负责执行这些指令（中间还有一些小插曲，下文再提）。

此时，上文的“通道”再次起作用，此函数内会根据 Pass 的优先顺序依次更新唯一值状态（UniformState），然后下发给 `executeCommand()` 函数（注意少了个`s`）以具体的某个指令对象以及 `Context` 对象。

> 除了 `executeCommand()` 函数外，`Scene.js` 模块内仍还有其它类似的函数，例如 `executeIdCommand()` 负责执行绘制 ID 信息纹理的指令，`executeTranslucentCommandsBackToFront()` / `executeTranslucentCommandsFrontToBack()` 函数负责透明物体的指令等。甚至在 Scene 对象自己的属性中，就有清屏指令字段，会在 `executeCommands()` 函数中直接执行，不经过上述几个执行具体指令的函数。

`Context` 对象是对 `WebGL(2)RenderingContext` 等 WebGL 原生接口、参数的封装，所有指令对象最终都会由其进行拆包装、组装 WebGL 函数调用并执行绘图、计算、清屏（见上文介绍的预备知识：指令）。



# 2. 多段视锥体技术

先介绍一个概念，WebGL 中的深度。

简单的说，屏幕朝里，三维物体的前后顺序就是深度。CesiumJS 的深度非常大，即使不考虑远太空，只考虑地球表面附近的范围，WebGL 的数值范围也不太够用。聪明的前辈们想到了使用对数函数压缩深度的值域，因为一个非常大的数字只需取其对数，很快就能小下来。

Scene 对象上有一个可读可写访问器 `logarithmicDepthBuffer`，它指示是否启用对数深度。

现在，CesiumJS 通常使用的就是对数深度。

对数深度解决的不仅仅只是普通深度值值域不够的问题，还解决了不支持对数深度技术之前使用的多段视锥技术问题。

再次简单的说，多段视锥技术将视锥体由远及近切成多个段，保证了相机近段的指令足够多以保证效果，远段尽量少满足性能。

你在 `Scene.js` 模块中的 `executeCommands()` 函数的最后能找到一个循环体：

``` js
// Execute commands in each frustum in back to front order
let j;
for (let i = 0; i < numFrustums; ++i) {
  // ...
}
```

打开调试工具，很容易击中这个断点，查看 `numFrustums` 变量的值，有启用对数深度的 CesiumJS 程序，一般 `numFrustums` 都是 1。



# 3. 指令对象的转移

在本文第 1 节中，详细说明了指令对象的生成与被执行。

上述其实忽略了很多细节，现在捡起来说。

指令对象在 Primitive（或类似的类）生成后，由 模块内的 `updateAndQueueCommands()` 函数排序并推入帧状态对象的指令列表上：

```js
// updateAndQueueCommands 函数中，函数接收来自 Scene 逐级传入的帧状态对象 -- frameState
const commandList = frameState.commandList;
const passes = frameState.passes;
if (passes.render || passes.pick) {
  // ... 省略部分代码
  commandList.push(colorCommand);
}
```

`frameState.commandList` 就是个普通的数组。

而在执行时，却是从 `View` 对象上的 `frustumCommandsList` 上取的指令：

``` js
// Scene.js 模块的 executeCommands 函数中

const frustumCommandsList = view.frustumCommandsList;
const numFrustums = frustumCommandsList.length;

let j;
for (let i = 0; i < numFrustums; ++i) {
  const index = numFrustums - i - 1;
  const frustumCommands = frustumCommandsList[index];
  
  // ...
  
  // 截取不透明物体的通道指令执行代码片段
  us.updatePass(Pass.OPAQUE);
  commands = frustumCommands.commands[Pass.OPAQUE];
  length = frustumCommands.indices[Pass.OPAQUE];
  for (j = 0; j < length; ++j) {
    executeCommand(commands[j], scene, context, passState);
  }
  
  // ...
}
```

其中，下发给 `executeCommand()` 函数的 `commands[j]` 参数，就是具体的某个指令对象。

**所以这两个过程之间，是怎么做指令对象传递的？**

答案就在 `View` 原型链上的 `createPotentiallyVisibleSet` 方法中。

## 筛选可见集

`View` 对象是 Scene、Camera 之间的纽带，负责“眼睛”与“世界”之间信息的处理，即视图。

`View` 原型链上的 `createPotentiallyVisibleSet` 方法的作用，就是把 Scene 上的计算指令、覆盖物指令，帧状态上的指令列表，根据 View 的可见范围做一次筛选，减少要执行指令个数提升性能。

具体来说，就是把分散在各处的指令，筛选后绑至 View 对象的 `frustumCommandsList` 列表中，借助 `View.js` 模块内的 `insertIntoBin()` 函数完成：

``` js
// View.js 模块内

function insertIntoBin(view, scene, command, commandNear, commandFar) {
  // ...
  
  const frustumCommandsList = view.frustumCommandsList;
  const length = frustumCommandsList.length;

  for (let i = 0; i < length; ++i) {
    // ...
    
    frustumCommands.commands[pass][index] = command;
   
    // ...
  }
  
  // ...
}   
```

这个函数内做了对指令的筛选判断。



# 4. 本篇总结

本篇调查清楚了 `Scene` 对象上各种三维物体是如何绘制的，即借助 **指令** 对象保存待绘制的信息，最后交由 `Context` 对象完成 WebGL 代码的执行。

期间，发生了指令的分类和可见集的筛选；篇幅原因，CesiumJS 在这漫长的渲染过程中还做了很多细节的事情。

不过，Cesium 的三维物体的渲染架构就算讲完了。

接下来，则是另两个比较头痛的话题：

- 地球的渲染架构（瓦片四叉树）
- 具备创建指令的各路数据源（Entity、DataSource、Model、Cesium3DTileset等）

指令和通道的概念仍然会继续使用，敬请期待。
