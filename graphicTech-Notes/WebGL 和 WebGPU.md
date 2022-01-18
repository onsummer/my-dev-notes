WebGL API 与 WebGPU API 比对



- 初始化篇
- Buffer 篇
  - Uniform

- Shader 篇
- Texture 篇
- 容器（Framebuffer 与 RenderPass）



# 前奏篇

这篇讲讲历史，不太适合直奔主题的朋友们。

## ① 为什么是 WebGPU 而不是 WebGL 3.0

你若往 Web 图形技术的底层去深究，一定能追溯到上个世纪 90 年代提出的 OpenGL 技术，也一定能看到，WebGL 就是基于 OpenGL ES 做出来的这些信息。OpenGL 在那个显卡羸弱的年代发挥了它应有的价值。

### 显卡驱动

我们都知道现在的显卡都要安装显卡驱动程序，通过显卡驱动程序暴露的 API，我们就可以操作 GPU 完成图形处理器的操作。

问题就是，显卡驱动和普通编程界的汇编一样，底层，不好写，于是各大厂就做了封装 —— 码界的基操。

### 图形 API 的简单年表

OpenGL 就是干这个的，负责上层接口封装并与下层显卡驱动打交道，但是，众所周知，它的设计风格已经跟不上现代 GPU 的特性了。

Microsoft 为此做出来最新的图形API 是 Direct3D 12，Apple 为此做出来最新的图形API 是 Metal，有一个著名的组织则做出来 Vulkan，这个组织名叫 Khronos。D3D12 现在在发光发热的地方是 Windows 和 PlayStation，Metal 则是 Mac 和 iPhone，Vulkan 你可能在安卓手机评测上见得多。这三个图形 API 被称作三大现代图形API，与现代显卡（无论是PC还是移动设备）的联系很密切。

### WebGL 能运行在各个浏览器的原因

噢，忘了一提，OpenGL 在 2006 年把丢给了 Khronos 管，现在各个操作系统基本都没怎么装这个很老的图形驱动了。

那问题来了，基于 OpenGL ES 的 WebGL 为什么能跑在各个操作系统的浏览器？

因为 WebGL 再往下已经可以不是 OpenGL ES 了，在 Windows 上现在是通过 D3D 转译到显卡驱动的，在 macOS 则是 Metal，只不过时间越接近现在，这种非亲儿子式的实现就越发困难。

苹果的 Safari 浏览器最近几年才珊珊支持 WebGL 2.0，而且已经放弃了 OpenGL ES 中 GPGPU 的特性了，或许看不到 WebGL 2.0 的 GPGPU 在 Safari 上实现了，果子哥现在正忙着 Metal 和更伟大的 M 系列自研芯片呢。

### WebGPU 的名称由来

所以，综上所述，下一代的 Web 图形接口不叫 WebGL 3.0 的原因，你清楚了吗？已经不是 GL 一脉的了，为了使现代巨头在名称上不打架，所以采用了更贴近硬件名称的 WebGPU，WebGPU 从根源上和 WebGL 就不是一个时代的，无论是编码风格还是性能表现上。

题外话，OpenGL 并不是没有学习的价值，反而它还会存在一段时间，WebGL 也一样。

## ② 与 WebGL 比较编码风格

WebGL 实际上可以说是 OpenGL 的影子，OpenGL 的风格对 WebGL 的风格影响巨大。

学习过 WebGL 接口的朋友都知道一个东西：`gl` 变量，准确的说是 `WebGLRenderingContext` 对象，WebGL 2.0 则是 `WebGLRenderingContext2`.

### OpenGL 的编码风格

无论是操作着色器，还是操作 VBO，亦或者是创建一些 Buffer、Texture 对象，基本上都得通过 gl 变量一条一条函数地走过程，顺序是非常讲究的，例如，下面是创建两大着色器并执行编译、连接的代码：

``` js
const vertexShaderCode = `
attribute vec4 a_position;
void main() {
	gl_Position = a_position;
}
`

const fragmentShaderCode = `
precision mediump float;
void main() {
  gl_FragColor = vec4(1, 0, 0.5, 1);
}
`

const vertexShader = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(vertexShader, vertexShaderCode)
gl.compileShader(vertexShader)
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fragmentShader, fragmentShaderCode)
gl.compileShader(fragmentShader)

const program = gl.createProgram()
gl.attachShader(program, vertexShader)
gl.attachShader(program, fragmentShader)
gl.linkProgram(program)

// 还需要显式指定你需要用哪个 program
gl.useProgram(program)
// 继续操作顶点数据并触发绘制
// ...
```

创建着色器、赋予着色器代码并编译的三行 js WebGL 调用，可以说是必须这么写了，顶多 vs 和 fs 的创建编译顺序可以换一下，但是又必须在 program 之前完成这些操作。

### CPU 负载问题

有人说这无所谓，可以封装成 JavaScript 函数，隐藏这些过程细节，只需传递参数即可。是，这是一个不错的封装，很多 js 库都做过，并且都很实用。

但是，这仍然有难以逾越的鸿沟 —— 那就是 OpenGL 本身的问题。

每一次调用 `gl.xxx` 时，都会完成 CPU 到 GPU 的信号传递，改变 GPU 的状态，是立即生效的。熟悉计算机基础的朋友应该知道，计算机内部的时间和硬件之间的距离有多么重要，世人花了几十年时间无不为信号传递付出了努力，上述任意一条 gl 函数改变 GPU 状态的过程，大致要走完 CPU ~ 总线 ~ GPU 这么长一段距离。

我们都知道，办事肯定是一次性备齐材料的好，不要来来回回跑那么多遍，而 OpenGL 就是这样子的。有人说为什么要这样而不是改成一次发送的样子？历史原因，OpenGL 盛行那会儿 GPU 的工作没那么复杂，也就不需要那么超前的设计。

综上所述，WebGL 是存在 CPU 负载隐患的，是由于 OpenGL 这个状态机制决定的。

现代三大图形API 可不是这样，它们更倾向于先把东西准备好，最后提交给 GPU 的就是一个完整的设计图纸和缓冲数据，GPU 只需要拿着就可以专注办事。

### WebGPU 的装配式编码风格

WebGPU 虽然也有一个总管家一样的对象 —— device，类型是 `GPUDevice`，表示可以操作 GPU 设备的一个高层级抽象，它负责创建操作图形运算的各个对象，最后装配成一个叫 “CommandBuffer（指令缓冲，GPUCommandBuffer）”的对象并提交给队列，这才完成 CPU 这边的劳动。

所以，device.createXXX 创建过程中的对象时，并不会像 WebGL 一样立即通知 GPU 完成状态的改变，而是在 CPU 端写的代码就从逻辑、类型上确保了待会传递给 GPU 的东西是准确的，并让他们按自己的坑站好位，随时等待提交给 GPU。

在这里，指令缓冲对象具备了完整的数据资料（几何、纹理、着色器、管线调度逻辑等），GPU 一拿到就知道该干什么。

``` js
// 在异步函数中
const device = await adapter.requestDevice()
const buffer = device.createBuffer({
  /* 装配几何，传递内存中的数据，最终成为 vertexAttribute 和 uniform 等资源 */
})
const texture = device.createTexture({
  /* 装配纹理和采样信息 */
})

const pipelineLayout = device.createPipelineLayout({
  /* 创建管线布局，传递绑定组布局对象 */
})

/* 创建着色器模块 */
const vertexShaderModule = device.createShaderModule({ /* ... */ })
const fragmentShaderModule = device.createShaderModule({ /* ... */ })

/*
计算着色器可能用到的着色器模块
const computeShaderModule = device.createShaderModule({ /* ... * / })
*/

const bindGroupLayout = device.createBindGroupLayout({
  /* 创建绑定组的布局对象 */
})

const pipelineLayout = device.createPipelineLayout({
  /* 传递绑定组布局对象 */
})

/*
上面两个布局对象其实可以偷懒不创建，绑定组虽然需要绑定组布局以
通知对应管线阶段绑定组的资源长啥样，但是绑定组布局是可以由
管线对象通过可编程阶段的代码自己推断出来绑定组布局对象的
本示例代码保存了完整的过程
*/

const pipeline = device.createRenderPipeline({
  /* 
  创建管线
  指定管线各个阶段所需的素材
  其中有三个阶段可以传递着色器以实现可编程，即顶点、片段、计算 
  每个阶段还可以指定其所需要的数据、信息，例如 buffer 等
  
  除此之外，管线还需要一个管线的布局对象，其内置的绑定组布局对象可以
  让着色器知晓之后在通道中使用的绑定组资源是啥样子的
  */
})

const bindGroup_0 = deivce.createBindGroup({
  /* 
  资源打组，将 buffer 和 texture 归到逻辑上的分组中，
  方便各个过程调用，过程即管线，
  此处必须传递绑定组布局对象，可以从管线中推断获取，也可以直接传递绑定组布局对象本身
  */
})

const commandEncoder = device.createCommandEncoder() // 创建指令缓冲编码器对象
const renderPassEncoder = commandEncoder.beginRenderPass() // 启动一个渲染通道编码器
// 也可以启动一个计算通道
// const computePassEncoder = commandEncoder.beginComputePass({ /* ... */ }) 

/*
以渲染通道为例，使用 renderPassEncoder 完成这个通道内要做什么的顺序设置，例如
*/

// 第一道绘制，设置管线0、绑定组0、绑定组1、vbo，并触发绘制
renderPassEncoder.setPipeline(renderPipeline_0)
renderPassEncoder.setBindGroup(0, bindGroup_0)
renderPassEncoder.setBindGroup(1, bindGroup_1)
renderPassEncoder.setVertexBuffer(0, vbo, 0, size)
renderPassEncoder.draw(vertexCount)

// 第二道绘制，设置管线1、另一个绑定组并触发绘制
renderPassEncoder.setPipeline(renderPipeline_1)
renderPassEncoder.setBindGroup(1, another_bindGroup)
renderPassEncoder.draw(vertexCount)

// 结束通道编码
renderPassEncoder.endPass()

// 最后提交至 queue，也即 commandEncoder 调用 finish 完成编码，返回一个指令缓冲
device.queue.submit([
  commandEncoder.finish()
])
```

上述过程是 WebGPU 的一般化代码，很粗糙，没什么细节，不过基本上就是这么个逻辑。

对通道编码器的那部分代码，笔者保留的比较完整，让读者更好观察一个指令编码器是如何编码通道，并最后结束编码创建指令缓冲提交给队列的。



### 厨子戏法

用做菜来比喻，OpenGL 系的编程就好比做一道菜时需要什么调料就去拿什么调料，做好一道菜再继续做下一道菜；而现代图形API 则是多灶台开火，所有材料都在合适的位置上，包括处理好的食材和辅料，即使一个厨师（CPU）都可以同时做好几道菜，效率很高。



## ③ 多线程与强大的通用计算（GPGPU）能力

### WebWorker 多线程

WebGL 的总管家对象是 gl 变量，它必须依赖 HTML Canvas 元素，也就是说必须由主线程获取，也只能在主线程调度 GPU 状态，WebWorker 技术的多线程能力只能处理数据，比较鸡肋。

WebGPU 改变了总管家对象的获取方式，adapter 对象所依赖的 `navigator.gpu` 对象在 WebWorker 中也可以访问，所以在 Worker 中也可以创建 device，也可以装配出指令缓冲，从而实现多线程提交指令缓冲，实现 CPU 端多线程调度 GPU 的能力。

### 通用计算（GPGPU）

如果说 WebWorker 是 CPU 端的多线程，那么 GPU 本身的多线程也要用上。

能实现这一点的，是一个叫做“计算着色器”的东西，它是可编程管线中的一个可编程阶段，在 OpenGL 中可谓是姗姗来迟（因为早期的显卡并没挖掘其并行通用计算的能力），更别说 WebGL 到了 2.0 才支持了，苹果老兄甚至压根就懒得给 WebGL 2.0 实现这个特性。

WebGPU 出厂就带这玩意儿，通过计算着色器，使用 GPU 中 CU（Compute Unit，计算单元）旁边的共享内存，速度比普通的显存速度快得多。

有关计算着色器的资料不是特别多，目前只能看例子，在参考资料中也附带了一篇博客。

将 GPGPU 带入 Web 端后，脚本语言的运行时（deno、浏览器JavaScript，甚至未来的 nodejs 也有可能支持 WebGPU）就可以访问 GPU 的强大并行计算能力，据说 tensorflow.js 改用 WebGPU 作为后置技术后性能有极为显著的提升，对深度学习等领域有极大帮助，**即使用户的浏览器没那么新潮，渲染编程还没那么快换掉 WebGL，WebGPU 的通用计算能力也可以在别的领域发光发热，更别说计算着色器在渲染中也是可以用的。**

真是诱人啊！



## ④ 浏览器的实现 

Edge 和 Chrome 截至发文，在金丝雀版本均可以通过 flag 打开试用。

Edge 和 Chrome 均使用了 Chromium 核心，Chromium 是通过 Dawn 这个模块实现的 WebGPU API，根据有关资料，Dawn 中的 DawnNative 部分负责与三大图形 API 沟通，向上则给一个叫 DawnWire 的模块传递信息，DawnWire 模块则负责与 JavaScript API 沟通，也就是你写的 WebGPU 代码。WGSL 也是这个部分实现的。Dawn 是 C++ 实现的，你可以在参考资料中找到连接。

FireFox 则使用了 gfx-rs 项目实现 WebGPU，显然是 Rust 语言实现的 WebGPU，也有与 Dawn 类似的模块设计。

Safari 则更新自家的 WebKit 实现 WebGPU。



## ⑤ 未来

展望宏图之类的话不说，但是随着红绿蓝三家的 GPU 技术越发精湛，加上各个移动端的 GPU 逐渐起色，三大现代图形API肯定还在发展，WebGPU 一定能在 Web 端释放现代图形处理器（GPU）的强大能力，无论是图形游戏，亦或是通用并行计算带来的机器学习、AI能力。



## 参考资料

- [Google Dawn Page](https://dawn.googlesource.com/dawn/)
- [gfx-rs GitHub Home Page](https://github.com/gfx-rs)
- [Get started with GPU Compute on the web](https://web.dev/gpu-compute/)



# 初始化篇

## 1. gl 与 device：获取高频操作对象

WebGL 获取的是 `WebGLRenderingContext/WebGLRenderingContext2` 对象，必须依赖于有合适宽度和高度的 `HTMLCanvasElement`，通常命名为 `gl`，gl 变量有非常多方法，允许修改 WebGL 的全局状态

``` js
const gl = document.getElementById("id")?.getContext("webgl")

// ...
```

而 WebGPU 则不依赖具体的 Canvas，它操作的是物理图形卡设备，并使用 `ES6/7` 的异步语法获取，获取的是 `GPUAdapter` 和 `GPUDevice`，但是与 `WebGLRenderingContext` 起着类似“发出大多数命令”的大管家式角色的，更多是 `GPUDevice` 对象

```js
const entryFn = async () => {
  if (!navigator.gpu) {
    return
  }
  // 测试版 Chrome 有可能返回 null
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    return
  }
	const device = await adapter.requestDevice()
  // ...
}

entryFn()
```

WebGPU 的入口是 `navigator.gpu` 对象，这个对象在 WebWorker 中也有，所以对 CPU 端的多线程有良好的支持。使用此对象异步请求适配器后，再使用适配器请求具象化的设备对象即可。

至于“适配器”和“设备”的概念界定，需要读者自行阅读“Explainer”等资料，前者大概是物理设备的一个变量符号，而根据不同的场景、线程需求再次请求不同的“设备”，此设备并非物理设备，只是一个满足代码上下文所需要条件的、更实际的“对象”。

> 每次请求的适配器对象是不同的，不具备单例特征。

设备对象用于创建 WebGPU 中几乎所有的子类型，包括 `GPUBuffer`、`GPUTexture` 等，以及访问一些自有属性，例如队列属性 `device.queue`.

## 2. 初始化参数的异同

### ① WebGL

在 WebGLRenderingContext 时，允许传递一些参数：

``` js
const gl = canvasEle.getContext("webgl", {
  alpha: false, // 是否包含透明度缓存区
  antialias: false, // 是否开抗锯齿
  depth: false, // 是否包含一个16位的深度缓冲区
  stencil: false, // 是否包含一个8位的模板缓冲区
  failIfMajorPerformanceCaveat: false, // 在系统性能低的环境中是否创建上下文
  powerPreference: "high-performance", // GPU电源配置，"high-performance" 是高性能
  preserveDrawingBuffer: false, // 是否保留缓冲区
  premultipliedAlpha: false, // 是否预乘透明度通道
})
```

### ② WebGPU Adapter

在请求 WebGPU 的适配器时，则只保留了性能选项（当前规范）powerPreference（`forceFallbackAdpater` 参数一般较少用）：

``` js
// in async function
const adapter = await navigator.gpu.requestAdapter({
  powerPreference: "high-performance",
})
```

关于参数的类型 `GPURequestAdapterOptions` 定义，见下：

```web-idl
dictionary GPURequestAdapterOptions {
  GPUPowerPreference powerPreference;
  boolean forceFallbackAdapter = false;
};

enum GPUPowerPreference {
  "low-power",
  "high-performance",
};
```

### ③ WebGPU Device

请求设备对象时，则允许传入 `GPUDeviceDescriptor` 参数对象，该对象允许有两个可选参数，一个是 `requiredFeatures`，类型为 `string[]`，另一个是 `requiredLimits`，类型是键为 string 值为 number 的对象：

``` web-idl
dictionary GPUDeviceDescriptor : GPUObjectDescriptorBase {
  sequence<GPUFeatureName> requiredFeatures = [];
  record<DOMString, GPUSize64> requiredLimits = {};
};
```

requireFeatures 数组的字符串不是随便填的，要参考 [WebGPU Spec 24 功能索引表](https://www.w3.org/TR/webgpu/#feature-index) 中的功能。传递这个功能数组，就意味着要向适配器请求有这么多功能的设备对象；

requireLimits 对象用来约束即将请求的适配器对象最大能力到多少，要参考 [WebGPU Spec 3.6 限制](https://www.w3.org/TR/webgpu/#limit) 中的表格，例如下面这个例子限制了即将请求的设备对象最多只能有 2 个绑定组（默认是4个，越大越好），限定了 UBO 最多只能有 4 个（默认12个，越大越好）：

``` js
const device = await adapter.requestDevice({
  maxBindGroups: 2,
  maxUniformBuffersPerShaderStage: 4
})
```

若适配器无法满足上述两个请求参数，会请求不到设备对象，即请求失败。

## 3. 总结

WebGL 的请求参数包括了性能参数和功能参数，较为简单。

WebGPU 分成了两个阶段，请求适配器时可以对性能作要求，请求设备对象时可以对功能方面的参数作要求。



# VertexBuffer 篇

顶点缓冲是渲染管线中顶点着色阶段所需的资源。

## 1. VertexBuffer/ElementBuffer

### WebGL

WebGL 使用 TypedArray 进行数据传递，这点 WebGPU 也是一样的。

``` js
const positions = [
  0, 0,
  0, 0.5,
  0.7, 0,
]

/*
创建着色器程序 program...
*/

// 获取 vertex attribute 在着色器中的位置
const positionAttributeLocation = gl.getAttribLocation(program, "a_position")

/* 创建 WebGLBuffer */
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

gl.enableVertexAttribArray(positionAttributeLocation)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
/* end */
```

WebGL 通过 gl 变量的 createBuffer、bindBuffer、bufferData 方法来创建缓冲、绑定当前要用什么缓冲及缓冲的用途、向缓冲传递 CPU 端的 TypedArray 数据并指明绘制模式，通过 gl 变量的 enableVertexAttribArray、vertexAttribPointer 方法来启用着色器中 attribute 的坑位、告诉着色器如何从 VertexBuffer 中获取顶点数据。



### WebGPU

#### A. GPUBuffer 的创建与数据输入

WebGPU 中的 VertexBuffer 的创建其实我在 [WebGPU 补充篇之 VertexBuffer](https://zhuanlan.zhihu.com/p/412694412) 讲得比较详细了，这里主要是贴个代码。

``` js
const vbodata = new Float32Array([
  // 坐标 xy      // 颜色 RGBA
  -0.5, 0.0,     1.0, 0.0, 0.0, 1.0, // ← 顶点 1
  0.0, 0.5,      0.0, 1.0, 0.0, 1.0, // ← 顶点 2
  0.5, 0.0,      0.0, 0.0, 1.0, 1.0  // ← 顶点 3
])
const vbo = device.createBuffer({
  size: vbodata.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true // 创建时立刻映射，让 CPU 端能读写数据
})

// 实例化一个新的 Float32Array，并获取 GPUBuffer 的映射范围，传入上面的数据，这样 ArrayBuffer 就有值了
new Float32Array(vbo.getMappedRange()).set(vbodata)
vbo.unmap() // 一定要解除映射，GPU 才能读写
```

观察到，WebGPU 创建 VertexBuffer 是调取设备对象的 `createBuffer` 方法，返回一个 `GPUBuffer` 对象，它所需要的是指定 GPUBuffer 的类型以及缓冲的大小。如何写入这块缓冲呢？那还要提到“映射”这个概念。

映射简单的说就是让 CPU/GPU 单边访问。此处创建 GPUBuffer 的参数中有一个 `mappedAtCreation` 表示创建时就映射。

上面代码中 `vbo.getMappedRange()` 返回的是一个 ArrayBuffer，随后才进行 set Float32Array 这个操作。数据填充完毕后，还需要 `unmap` 来解除 CPU 端的映射。

#### B. 向顶点着色器传递顶点缓冲的格式描述

顶点着色阶段是渲染管线的一个组分，它需要知道顶点缓冲的字节排布。

而创建渲染管线则需要着色器模块，顶点着色器模块的创建参数就有一个 `buffers` 字段，用于描述缓冲的样子：

``` js
const vsShaderModule = device.createShaderModule({
  // ...
  buffers: [
    {
      shaderLocation: 0,
      offset: 0,
      format: 'float32x2'
    }, {
      shaderLocation: 1,
      offset: 2 * vbodata.BYTES_PER_ELEMENT,
      format: 'float32x4'
    }
  ]
})
```

不详细展开了，有需要了解的可查阅官方 API 文档中关于设备对象的 createShaderModule 方法的要求。



#### C. 在渲染通道中设置顶点缓冲

渲染通道使用渲染通道编码器来起草单个通道的渲染流程，其中有一步要设置该通道的顶点缓冲。这个比较简单：

``` js
// ...
passEncoder.setVertexBuffer(0, vbo)
// ...
```

#### D. 着色器代码中接收顶点属性

此部分略，见上面 VertexBuffer 文章的连接。



### 比对

vertexAttribPointer 方法的作用类似于 createShaderModule 中 `buffers` 的作用，告诉着色器如何取值。

gl.createBuffer 和 device.createBuffer 是类似的

数据传递则不大一致了，WebGL 一次绘制只能指定一次 VertexBuffer，所以 bindBuffer、bufferData 一系列下来都沿着逻辑走；而 WebGPU 的数据传递则需要经过映射和解映射，而且还要在通道中显式指定用哪一个 VertexBuffer（因为支持多个了）。

着色器和着色器代码本身就不展开了。



## 2. VAO



## 3. Uniform



# Texture 篇

