这篇讲讲历史，不太适合直奔主题的朋友们。

# 1 为什么是 WebGPU 而不是 WebGL 3.0

你若往 Web 图形技术的底层去深究，一定能追溯到上个世纪 90 年代提出的 OpenGL 技术，也一定能看到，WebGL 就是基于 OpenGL ES 做出来的这些信息。OpenGL 在那个显卡羸弱的年代发挥了它应有的价值。

## 显卡驱动

我们都知道现在的显卡都要安装显卡驱动程序，通过显卡驱动程序暴露的 API，我们就可以操作 GPU 完成图形处理器的操作。

问题就是，显卡驱动和普通编程界的汇编一样，底层，不好写，于是各大厂就做了封装 —— 码界的基操。

## 图形 API 的简单年表

OpenGL 就是干这个的，负责上层接口封装并与下层显卡驱动打交道，但是，众所周知，它的设计风格已经跟不上现代 GPU 的特性了。

Microsoft 为此做出来最新的图形API 是 Direct3D 12，Apple 为此做出来最新的图形API 是 Metal，有一个著名的组织则做出来 Vulkan，这个组织名叫 Khronos。D3D12 现在在发光发热的地方是 Windows 和 PlayStation，Metal 则是 Mac 和 iPhone，Vulkan 你可能在安卓手机评测上见得多。这三个图形 API 被称作三大现代图形API，与现代显卡（无论是PC还是移动设备）的联系很密切。

## WebGL 能运行在各个浏览器的原因

噢，忘了一提，OpenGL 在 2006 年把丢给了 Khronos 管，现在各个操作系统基本都没怎么装这个很老的图形驱动了。

那问题来了，基于 OpenGL ES 的 WebGL 为什么能跑在各个操作系统的浏览器？

因为 WebGL 再往下已经可以不是 OpenGL ES 了，在 Windows 上现在是通过 D3D 转译到显卡驱动的，在 macOS 则是 Metal，只不过时间越接近现在，这种非亲儿子式的实现就越发困难。

苹果的 Safari 浏览器最近几年才珊珊支持 WebGL 2.0，而且已经放弃了 OpenGL ES 中 GPGPU 的特性了，或许看不到 WebGL 2.0 的 GPGPU 在 Safari 上实现了，果子哥现在正忙着 Metal 和更伟大的 M 系列自研芯片呢。

## WebGPU 的名称由来

所以，综上所述，下一代的 Web 图形接口不叫 WebGL 3.0 的原因，你清楚了吗？已经不是 GL 一脉的了，为了使现代巨头在名称上不打架，所以采用了更贴近硬件名称的 WebGPU，WebGPU 从根源上和 WebGL 就不是一个时代的，无论是编码风格还是性能表现上。

题外话，OpenGL 并不是没有学习的价值，反而它还会存在一段时间，WebGL 也一样。

# 2 与 WebGL 比较编码风格

WebGL 实际上可以说是 OpenGL 的影子，OpenGL 的风格对 WebGL 的风格影响巨大。

学习过 WebGL 接口的朋友都知道一个东西：`gl` 变量，准确的说是 `WebGLRenderingContext` 对象，WebGL 2.0 则是 `WebGLRenderingContext2`.

## OpenGL 的编码风格

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

## CPU 负载问题

有人说这无所谓，可以封装成 JavaScript 函数，隐藏这些过程细节，只需传递参数即可。是，这是一个不错的封装，很多 js 库都做过，并且都很实用。

但是，这仍然有难以逾越的鸿沟 —— 那就是 OpenGL 本身的问题。

每一次调用 `gl.xxx` 时，都会完成 CPU 到 GPU 的信号传递，改变 GPU 的状态，是立即生效的。熟悉计算机基础的朋友应该知道，计算机内部的时间和硬件之间的距离有多么重要，世人花了几十年时间无不为信号传递付出了努力，上述任意一条 gl 函数改变 GPU 状态的过程，大致要走完 CPU ~ 总线 ~ GPU 这么长一段距离。

我们都知道，办事肯定是一次性备齐材料的好，不要来来回回跑那么多遍，而 OpenGL 就是这样子的。有人说为什么要这样而不是改成一次发送的样子？历史原因，OpenGL 盛行那会儿 GPU 的工作没那么复杂，也就不需要那么超前的设计。

综上所述，WebGL 是存在 CPU 负载隐患的，是由于 OpenGL 这个状态机制决定的。

现代三大图形API 可不是这样，它们更倾向于先把东西准备好，最后提交给 GPU 的就是一个完整的设计图纸和缓冲数据，GPU 只需要拿着就可以专注办事。

## WebGPU 的装配式编码风格

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



## 厨子戏法

用做菜来比喻，OpenGL 系的编程就好比做一道菜时需要什么调料就去拿什么调料，做好一道菜再继续做下一道菜；而现代图形API 则是多灶台开火，所有材料都在合适的位置上，包括处理好的食材和辅料，即使一个厨师（CPU）都可以同时做好几道菜，效率很高。



# 3 多线程与强大的通用计算（GPGPU）能力

## WebWorker 多线程

WebGL 的总管家对象是 gl 变量，它必须依赖 HTML Canvas 元素，也就是说必须由主线程获取，也只能在主线程调度 GPU 状态，WebWorker 技术的多线程能力只能处理数据，比较鸡肋。

WebGPU 改变了总管家对象的获取方式，adapter 对象所依赖的 `navigator.gpu` 对象在 WebWorker 中也可以访问，所以在 Worker 中也可以创建 device，也可以装配出指令缓冲，从而实现多线程提交指令缓冲，实现 CPU 端多线程调度 GPU 的能力。

## 通用计算（GPGPU）

如果说 WebWorker 是 CPU 端的多线程，那么 GPU 本身的多线程也要用上。

能实现这一点的，是一个叫做“计算着色器”的东西，它是可编程管线中的一个可编程阶段，在 OpenGL 中可谓是姗姗来迟（因为早期的显卡并没挖掘其并行通用计算的能力），更别说 WebGL 到了 2.0 才支持了，苹果老兄甚至压根就懒得给 WebGL 2.0 实现这个特性。

WebGPU 出厂就带这玩意儿，通过计算着色器，使用 GPU 中 CU（Compute Unit，计算单元）旁边的共享内存，速度比普通的显存速度快得多。

有关计算着色器的资料不是特别多，目前只能看例子，在参考资料中也附带了一篇博客。

将 GPGPU 带入 Web 端后，脚本语言的运行时（deno、浏览器JavaScript，甚至未来的 nodejs 也有可能支持 WebGPU）就可以访问 GPU 的强大并行计算能力，据说 tensorflow.js 改用 WebGPU 作为后置技术后性能有极为显著的提升，对深度学习等领域有极大帮助，**即使用户的浏览器没那么新潮，渲染编程还没那么快换掉 WebGL，WebGPU 的通用计算能力也可以在别的领域发光发热，更别说计算着色器在渲染中也是可以用的。**

真是诱人啊！



# 4 浏览器的实现 

Edge 和 Chrome 截至发文，在金丝雀版本均可以通过 flag 打开试用。

Edge 和 Chrome 均使用了 Chromium 核心，Chromium 是通过 Dawn 这个模块实现的 WebGPU API，根据有关资料，Dawn 中的 DawnNative 部分负责与三大图形 API 沟通，向上则给一个叫 DawnWire 的模块传递信息，DawnWire 模块则负责与 JavaScript API 沟通，也就是你写的 WebGPU 代码。WGSL 也是这个部分实现的。Dawn 是 C++ 实现的，你可以在参考资料中找到连接。

FireFox 则使用了 gfx-rs 项目实现 WebGPU，显然是 Rust 语言实现的 WebGPU，也有与 Dawn 类似的模块设计。

Safari 则更新自家的 WebKit 实现 WebGPU。



# 5 未来

展望宏图之类的话不说，但是随着红绿蓝三家的 GPU 技术越发精湛，加上各个移动端的 GPU 逐渐起色，三大现代图形API肯定还在发展，WebGPU 一定能在 Web 端释放现代图形处理器（GPU）的强大能力，无论是图形游戏，亦或是通用并行计算带来的机器学习、AI能力。



# 参考资料

- [Google Dawn Page](https://dawn.googlesource.com/dawn/)
- [gfx-rs GitHub Home Page](https://github.com/gfx-rs)
- [Get started with GPU Compute on the web](https://web.dev/gpu-compute/)





# Texture 篇

