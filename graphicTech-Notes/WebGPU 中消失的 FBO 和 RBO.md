OpenGL 体系给图形开发留下了不少的技术积累，其中就有不少的“Buffer”，耳熟能详的就有顶点缓冲对象（VertexbufferObject，VBO），帧缓冲对象（FramebufferObject，FBO）等。

切换到以三大现代图形开发技术体系为基础的 WebGPU 之后，这些经典的缓冲对象就在 API 中“消失了”。其实，它们的职能被更科学地分散到新的 API 去了。

本篇讲一讲 FBO 与 RBO，这两个通常用于离屏渲染逻辑中，以及到了 WebGPU 后为什么没有这两个 API 了（用什么作为了替代）。

# 1 WebGL 中的 FBO 与 RBO

WebGL 其实更多的角色是一个绘图 API，所以在 gl.drawArrays 函数发出时，必须确定将数据资源画到哪里去。

WebGL 允许 drawArrays 到两个地方中的任意一个：canvas 或 FramebufferObject. 很多资料都有介绍，canvas 有一个默认的帧缓冲，若不显式指定自己创建的帧缓冲对象（或者指定为 null）那就默认绘制到 canvas 的帧缓冲上。

换句话说，只要使用 `gl.bindFramebuffer()` 函数指定一个自己创建的帧缓冲对象，那么就不会绘制到 canvas 上。

> 本篇讨论的是 HTMLCanvasElement，不涉及 OffscreenCanvas



## 1.1 帧缓冲对象（FramebufferObject）

FBO 创建起来简单，它大多数时候就是一个负责点名的头儿，出汗水的都是小弟，也即它下辖的两类附件：

- 颜色附件（在 WebGL1 中有 1 个，在 WebGL 2 可以有16个）
- 深度模板附件（可以只用深度，也可以只用模板，也可以两个一起使用）

> 关于 MRT 技术（MultiRenderTarget），也就是允许输出到多个颜色附件的技术，WebGL 1.0 使用 `gl.getExtension('WEBGL_draw_buffers')` 获取扩展来使用；而 WebGL 2.0 原生就支持，所以颜色附件的数量上有所区别。

而这两大类附件则通过如下 API 进行设置：

```js
// 设置 texture 为 0 号颜色附件
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color0Texture, 0)
// 设置 rbo 为 0 号颜色附件
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color0Rbo)

// 设置 texture 为 仅深度附件
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0)
// 设置 rbo 为 深度模板附件（需要 WebGL2 或 WEBGL_depth_texture）
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthStencilRbo)
```

实际上，在需要进行 MRT 时，`gl.COLOR_ATTACHMENT0`、`gl.COLOR_ATTACHMENT1` ... 这些属性只是一个数字，可以通过计算属性进行颜色附件的位置索引，也可以直接使用明确的数字代替：

```
console.log(gl.COLOR_ATTACHMENT0) // 36064
console.log(gl.COLOR_ATTACHMENT1) // 36065

let i = 1
console.log(gl[`COLOR_ATTACHMENT${i}`]) // 36065
```



## 1.2 颜色附件与深度模板附件的真正载体

颜色附件与深度模板附件是需要明确指定数据载体的。WebGL 若改将绘图结果绘制到非 canvas 的 FBO，那么就需要明确指定具体画在哪。

如 1.1 小节的示例代码所示，每个附件都可以选择如下二者之一作为真正的数据载体容器：

- 渲染缓冲对象（`WebGLRenderbuffer`）
- 纹理对象（`WebGLTexture`）

有前辈在博客中指出，渲染缓冲对象会比纹理对象稍好，但是要具体问题具体分析。

> 实际上，在大多数现代 GPU 以及显卡驱动程序上，这些性能差异没那么重要。

简单的说，如果离屏绘制的结果不需要再进行下一个绘制中作为纹理贴图使用，用 RBO 就可以，因为只有纹理对象能向着色器传递。

关于 RBO 和纹理作为两类附件的区别的资料就没那么多了，而且这篇主要是比对 WebGL 和 WebGPU 二者的不同，就不再展开了。





## 1.3 FBO/RBO/WebGLTexture 相关方法收集

- `gl.framebufferTexture2D(gl.FRAMEBUFFER, <attachment_type>, <texture_type>, <texture>, <mip_level>)`：将 WebGLTexture 关联到 FBO 的某个附件上
- `gl.framebufferRenderbuffer(gl.FRAMEBUFFER, <attachment_type>, gl.RENDERBUFFER, <rbo>)`：将 RBO 关联到 FBO 的某个附件上
- `gl.bindFramebuffer(gl.FRAMEBUFFER, <fbo | null>)`：设置帧缓冲对象为当前渲染目标
- `gl.bindRenderbuffer(gl.RENDERBUFFER, <rbo>)`：绑定 `<rbo>` 为当前的 RBO
- `gl.renderbufferStorage(gl.RENDERBUFFER, <rbo_format>, width, height)`：设置当前绑定的 RBO 的数据格式以及长宽

下面是三个创建的方法：

- `gl.createFramebuffer()`
- `gl.createRenderbuffer()`
- `gl.createTexture()`

顺带回顾一下纹理的参数设置、纹理绑定与数据传递函数：

- `gl.texParameteri()`：设置当前绑定的纹理对象的参数
- `gl.bindTexture()`：绑定纹理对象为当前作用纹理
- `gl.texImage2D()`：向当前绑定的纹理对象传递数据，最后一个参数即数据



# 2 WebGPU 中的对等概念

WebGPU 已经没有 `WebGLFramebuffer` 和 `WebGLRenderbuffer` 这种类似的 API 了，也就是说，你找不到 `WebGPUFramebuffer` 和 `WebGPURenderbuffer` 这俩类。

但是，`gl.drawArray` 的对等操作还是有的，那就是渲染通道编码器（令其为 renderPassEncoder）发出的 `renderPassEncoder.draw` 动作。



## 2.1 渲染通道编码器（GPURenderPassEncoder）承担 FBO 的职能

WebGPU 的绘制目标在哪呢？由于 WebGPU 与 canvas 元素不是强关联的，所以必须显式指定绘制到哪里去。

通过学习可编程通道以及指令编码等概念，了解到 WebGPU 是通过一些指令缓冲来向 GPU 传递“我将要干啥”的信息的，而指令缓冲（Command Buffer）则由指令编码器（也即 `GPUCommandEncoder`）完成创建。指令缓冲由若干个 `Pass`（通道）构成，绘制相关的通道，叫做渲染通道。

渲染通道则是由渲染通道编码器来设置的，一个渲染通道就设定了这个通道的绘制结果要置于何处（这个描述就类比了 WebGL 要绘制到哪儿）。具体到代码中，其实就是创建 renderPassEncoder 时，传递的 `GPURenderPassDescriptor` 参数对象里的 colorAttachments 属性：

```js
const renderPassEncoder = commandEncoder.beginRenderPass({
  // 是一个数组，可以设置多个颜色附件
  colorAttachments: [
    {
      view: textureView,
      loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
      storeOp: 'store',
    }
  ]
})
```

注意到，colorAttachments[0].view 是一个 textureView，也即 `GPUTextureView`，换言之，意味着这个渲染通道要绘制到某个纹理对象上。

通常情况下，如果你不需要离屏绘制或者使用 msaa，那么应该是画到 canvas 上的，从 canvas 中获取其配置好的纹理对象如下操作：

```js
const context = canvas.getContext('webgpu')
context.configure({
  gpuDevice,
  format: presentationFormat, // 此参数可以使用画布的客户端长宽 × 设备像素缩放比例得到，是一个两个元素的数组
  size: presentationSize, // 此参数可以调用 context.getPreferredFormat(gpuAdapter) 获取
})

const textureView = context.getCurrentTexture().createView()
```

上述代码片段完成了渲染通道与屏幕 canvas 的关联，即把 canvas 视作一块 `GPUTexture`，使用其 `GPUTextureView` 与渲染通道的关联。

> 其实，更严谨的说法是 **渲染通道** 承担了 FBO 的部分职能（因为渲染通道还有发出其它动作的职能，例如设置管线等），因为没有 GPURenderPass 这个 API，所以只能委屈 GPURenderPassEncoder 代替一下了。



## 2.2 多目标渲染

为了进行多目标渲染，也即片元着色器要输出多个结果的情况（代码中表现为返回一个结构体），就意味着要多个颜色附件来承载渲染的输出。

此时，要配置渲染管线的片元着色阶段（fragment）的 targets 属性。

相关的从创建纹理、创建管线、指令编码例子代码如下所示，用到两个纹理对象来充当颜色附件的容器：

``` js
// 一、创建渲染目标纹理 1 和 2，以及其对应的纹理视图对象
const renderTargetTexture1 = device.createTexture({
  size: [/* 略 */],
  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
  format: 'rgba32float',
})
const renderTargetTexture2 = device.createTexture({
  size: [/* 略 */],
  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
  format: 'bgra8unorm',
})
const renderTargetTextureView1 = renderTargetTexture1.createView()
const renderTargetTextureView2 = renderTargetTexture2.createView()

// 二，创建管线，配置片元着色阶段的多个对应目标的纹素输出格式
const pipeline = device.createRenderPipeline({
  fragment: {
    targets: [
      {
        format: 'rgba32float'
      },
      {
        format: 'bgra8unorm'
      }
    ]
    // ... 其它属性省略
  },
  // ... 其它阶段省略
})

const renderPassEncoder = commandEncoder.beginRenderPass({
  colorAttachments: [
    {
      view: renderTargetTextureView1,
      // ... 其它参数
    },
    {
      view: renderTargetTextureView2,
      // ... 其它参数
    }
  ]
})
```

这样，两个颜色附件分别用上了两个纹理视图对象作为渲染目标，而且在管线对象的片元着色阶段也明确指定了两个 target 的格式。

于是，你可以在片元着色器代码中指定输出结构：

``` wgsl
struct FragmentStageOutput {
  @location(0) something: vec4<f32>;
  @location(1) another: vec4<f32>;
}

@stage(fragment)
fn main(/* 省略输入 */) -> FragmentStageOutput {
  var output: FragmentStageOutput;
  // 随便写俩数字，没什么意义
  output.something = vec4<f32>(0.156);
  output.another = vec4<f32>(0.67);
  
  return output;
}
```

这样，位于 location 0 的 something 这个 f32 型四维向量就写入了 renderTargetTexture1 的一个纹素，而位于 location 1 的 another 这个 f32 型四维向量则写入了 renderTargetTexture2 的一个纹素。

尽管，在 pipeline 的片元阶段中 target 指定的 format 略有不一样，即 renderTargetTexture2 指定为 `'bgra8unorm'`，而着色器代码中结构体的 1 号 location 数据类型是 `vec4<f32>`，WebGPU 会帮你把 f32 这个 `[0.0f, 1.0f]` 范围内的输出映射到 `[0, 255]` 这个 8bit 整数区间上的。

> 事实上，如果没有多输出（也即多目标渲染），WebGPU 中大部分片元着色器的返回类型就是一个单一的 `vec4<f32>`，而最常见的 canvas 最佳纹理格式是 `bgra8unorm`，总归要发生 `[0.0f, 1.0f]` 通过放大 255 倍再取整到 `[0, 255]` 这个映射过程的。



## 2.3 深度附件与模板附件

`GPURenderPassDescriptor` 还支持传入 depthStencilAttachment，作为深度模板附件，代码举例如下：

``` js
const renderPassDescriptor = {
  // 颜色附件设置略
  depthStencilAttachment: {
    view: depthTexture.createView(),
    depthLoadValue: 1.0,
    depthStoreOp: 'store',
    stencilLoadValue: 0,
    stencilStoreOp: 'store',
  }
}
```

与单个颜色附件类似，也需要一个纹理对象的视图对象为 view，需要特别注意的是，作为深度或模板附件，一定要设置与深度、模板有关的纹理格式。

若对深度、模板的纹理格式在额外的设备功能（Device feature）中，在请求设备对象时一定要加上对应的 feature 来请求，例如有 `"depth24unorm-stencil8"` 这个功能才能用 `"depth24unorm-stencil8"` 这种纹理格式。

深度模板的计算，还需要注意渲染管线中深度模板阶段参数对象的配置，例如：

``` js
const renderPipeline = device.createRenderPipeline({
  // ...
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus',
  }
})
```



## 2.4 非 canvas 的纹理对象作为两种附件的注意点

除了深度模板附件里提及的纹理格式、请求设备的 feature 之外，还需要注意非 canvas 的纹理若作为某种附件，那它的 usage 一定包含 `RENDER_ATTACHMENT` 这一项。

``` js
const depthTexture = device.createTexture({
  size: presentationSize,
  format: 'depth24plus',
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
})

const renderColorTexture = device.createTexture({
  size: presentationSize,
  format: presentationFormat,
  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
})
```



# 3 读取数据

## 3.1 从 FBO 中读像素值

从 FBO 读像素值，实际上就是读颜色附件的颜色数据到 TypedArray 中，想读取当前 fbo（或 canvas 的帧缓冲）的结果，只需调用 `gl.readPixels` 方法即可。

``` js
//#region 创建 fbo 并将其设为渲染目标容器
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
//#endregion

//#region 创建离屏绘制的容器：纹理对象，并绑定它成为当前要处理的纹理对象
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

// -- 若不需要作为纹理再次被着色器采样，其实这里可以用 RBO 代替
//#endregion

//#region 绑定纹理对象到 0 号颜色附件
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
//#endregion

// ... gl.drawArrays 进行渲染

//#region 读取到 TypedArray
const pixels = new Uint8Array(imageWidth * imageHeight * 4);
gl.readPixels(0, 0, imageWiebdth, imageHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
//#endregion
```

`gl.readPixels()` 方法是把当前绑定的 FBO 及当前绑定的颜色附件的像素值读取到 TypedArray 中，无论载体是 WebGLRenderbuffer 还是 WebGLTexture.

唯一需要注意的是，如果你在写引擎，那么读像素的操作得在绘制指令（一般指 `gl.drawArrays` 或 `gl.drawElements`）发出后的代码中编写，否则可能会读不到值。



## 3.2 WebGPU 读 GPUTexture 中的数据

在 WebGPU 中将渲染目标，也即纹理中访问像素是比较简单的，使用到指令编码器的 copyTextureToBuffer 方法，将纹理对象的数据读取到 GPUBuffer，然后通过解映射、读范围的方式获取 ArrayBuffer.

``` js
//#region 创建颜色附件关联的纹理对象
const colorAttachment0Texture = device.createTexture({ /* ... */ })
//#endregion

//#region 创建用于保存纹理数据的缓冲对象
const readPixelsResultBuffer = device.createBuffer({
  usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  size: 4 * textureWidth * textureHeight,
})
//#endregion

//#region 图像拷贝操作，将 GPUTexture 拷贝到 GPUBuffer
const encoder = device.createCommandEncoder()
encoder.copyTextureToBuffer(
  { texture: colorAttachment0Texture },
  { buffer: readPixelsResultBuffer },
  [textureWidth, textureHeight],
)
device.queue.submit([encoder.finish()])
//#endregion

//#region 读像素
await readPixelsResultBuffer.mapAsync()
const pixels = new Uint8Array(readPixelsResultBuffer.getMappedRange())
//#endregion
```

要额外注意，如果要拷贝到 GPUBuffer 并且要交给 CPU 端（也就是 JavaScript）来读取，那这块 GPUBuffer 的 usage 一定要有 `COPY_DST` 和 `MAP_READ` 这两项；而且，这个纹理对象的 usage 也必须要有 `COPY_SRC` 这一项（作为颜色附件的关联纹理，它还得有 `RENDER_ATTACHMENT` 这一个 usage）。



# 4 总结

从 WebGL（也即 OpenGL ES 体系）到 WebGPU，离屏绘制技术、多目标渲染技术都有了接口和用法上的升级。

首先是取消了 RBO 这个概念，一律使用 Texture 作为绘制目标。

其次，更替了 FBO 的职权至 RenderPass，由 `GPURenderPassEncoder` 负责承载原来 FBO 的两类附件。

因为取消了 RBO 概念，所以 `RTT(RenderToTexture)` 和 `RTR(RenderToRenderbuffer)` 就不再存在了，但是离屏绘制技术依旧是存在的，你在 WebGPU 中可以使用多个 RenderPass 完成多个绘制成果，Texture 作为绘制载体可以自由地经过资源绑定组穿梭在不同的 RenderPass 的某个 RenderPipeline 中。

关于如何从 GPU 的纹理中读取像素（颜色值），第 3 节也有粗浅的讨论，这部分大多数用途是 GPU Picking；而关于 FBO 这个遗留概念，现在即 RenderPass 离屏渲染，最常见的还是做效果。