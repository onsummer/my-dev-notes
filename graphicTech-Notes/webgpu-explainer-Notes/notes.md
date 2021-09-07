https://gpuweb.github.io/gpuweb/explainer

# 1 介绍

WebGPU 是一种能让网页使用操作系统掌控的 GPU 来执行计算、绘制的 WebAPI。

它有点像 WebGL，但是 WebGPU 有更高级的用法。WebGPU 不像 WebGL 那样需要费老大劲才能完成通用计算，它对一般的计算有一流的支持。

## 1.1 用例

WebGPU 解决了 WebGL2 的一些问题：

- 绘制细节、对象较多的场景图像（例如 CAD 模型），WebGPU 的 draw command 的绘制成本比 WebGL 低。
- 执行用于绘制逼真场景的高级算法。由于缺乏通用计算的支持，现代渲染技术光靠 WebGL2 无法运行。
- 执行高效的机器学习运算。虽然在 WebGL 也可以运行，但是成本高得多。

具体的例子有：

- 改进现有 JavaScript 3D 库的渲染技术，并将 CPU 运算部分改到 GPU 上（剔除、蒙皮转换等）
- 将新一代的游戏引擎移植到 Web，获得更高级的渲染功能。例如，Unity 导出 WebGL 可能会因为保持最低兼容性损失一些特性，而导出 WebGPU 则能使用更高级的渲染功能
- 将新的程序移植到 Web，许多生产力相关的程序将转移至 GPU，使用 WebGPU 即可实现通用计算。
- 改进现有的网络电话会议程序，使用 WebGPU 进行机器学习会更快、更节能

## 1.2 目标

WebGPU 的目标是：

- 即时和离屏的现代渲染
- GPU 的通用计算更高效率
- 支持对各种原生 GPU API 的实现，包括：D3D12、Metal、Vulkan
- ...

它的目标不是：

- 不可编程或不太灵活的硬件支持
- 不能进行通用计算的硬件支持
- 尽可能支持原生 GPU API 的所有功能
- 让 WebGL 和 WebGPU 混合编程
- ...

## 1.3 为什么不叫 `WebGL 3`

WebGL 1 和 WebGL 2 分别是 OpenGL ES 2.0 和 OpenGL ES 3.0 在 JavaScript 上的接口实现。

WebGL 可以追溯到 1992 年发布的 OpenGL 1.0，这意味着 OpenGL 的技术可以沿袭到 WebGL 上来。但是这也意味着 WebGL 与现代 GPU 的设计不匹配，导致 CPU 和 GPU 的性能问题。

这也使得现代原生 GPU API（D3D12、Metal、Vulkan 等）用 WebGL 实现比较困难。WebGL 2 企图增加通用计算部分，但是不匹配问题让官方团队搞得十分头痛，故而转向 WebGPU。

> 译者注：说白了就是 OpenGL 体系的 WebGL 技术不太能发挥现代图形处理器的优势，而 WebGPU 对接的并不是 OpenGL，是 D3D12、Metal、Vulkan 等技术，所以它不是 WebGL 3.0

# 2 背景知识

略

# 3 JavaScript API

## 3.1 Adapters 和 Devices

WebGPU Adapter （适配器）是一个在系统上的 WebGPU 具体实现对象，通常来说就是指某个物理显卡（例如，集成在 CPU 内的核芯显卡或独立显卡）。

同一个页面上两个不同的 GPUAdapter 对象可能指向同一个底层实现，也可能是两个不同的显卡。

WebGPU Device（设备）表示的是与适配器的逻辑链接对象。有设备器对象的代码片段，可以认为能访问显卡适配器。

所有 WebGPU 对象（例如纹理、缓存）均由设备创建。

单页程序中的多个组件可以拥有各自的 WebGPU 设备。

> 猜测：设备屏蔽了不同适配器（物理显卡）之间的差异。

所有 WebGPU 的行为都是通过设备对象或从它创建的子对象完成的，从意义上来说，它扮演的角色类似于 `WebGLRenderingContext`，不同的是，它不直接与 `Canvas` 对象直接交互，而且大多数行为是通过它创建的子对象发出的。

### 3.1.1 适配器的选择和设备的初始化

使用 `navigator.gpu.requestAdapter()` 代码可获取适配器。这是一个异步函数。

你可以传递一个 options 对象：

``` js
let adapterRequestOptions = {
  powerPreference: "low-power"
}
```

来影响选择了哪个适配器。

`requestAdapter()` 只会 resolve，但是不能满足 option 的指定属性时，有可能会 resolve null 值。

``` js
const adapter = await navigator.gpu.requestAdapter(adapterRequestOptions)
if (!adapter) {
  return
}
```

适配器上有 `name` 属性、`limits` 属性（适配器的最大能力）等，来查看当前适配器的基本信息。



---

使用 `adapter.requestDevice()`，可以请求一个设备（连接）。同样可以传递一个配置选项对象来启用一些可选能力。

``` js
const device = await adapter.requestDevice(requestDeviceDescriptor)
```



---

适配器有可能状态会变成不可用，比如物理上脱离了机器、被禁用等。

## 3.2~3.4 略

## 3.5 缓存映射



## 3.6 多线程



## 3.7 命令编码和提交



## 3.8 管线



## 3.9 图像、视频、Canvas 的输入



## 3.10 输出到 Canvas

### 3.10.1 交换链



### 3.10.2 当前纹理



### 3.10.3 `getSwapChainPreferredFormat()`



### 3.10.4 多显示器

略。