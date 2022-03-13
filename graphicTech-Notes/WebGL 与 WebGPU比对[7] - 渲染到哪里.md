# 1. 综述

其实，写到第六篇比对基本上常规的 API 就差不多比对完了（除了 GPGPU、查询方面的 API 未涉及），但是有一个细节仍然值得我开一篇比对文章进行思考、记录，那就是渲染到何处。

WebGL 的上下文对象是与 canvas 元素强关联的，没有 canvas 创建不了上下文，也就是说，WebGL 在设计之初就是拿来绘图的（的确如此），没考虑 GPU 的其它功能，后来才逐渐加入其它功能。所以说，WebGL 若不显式指定 Framebuffer，那默认就是画到 canvas 自己身上。

WebGPU 则更强调“GPU”本身，它是需要自己制定绘制目标的，也就是在通道编码器中设置的颜色附件关联的纹理对象。

本篇着重介绍 WebGPU 这一处新设计。有关 FBO 和 RBO 技术与 WebGPU 的差异我另有文章，请自行查阅。



# 2. WebGL 中的绘图区

把帧缓冲映射到绘图窗口，就算完成了。WebGL 需要使用 `gl.viewport()` 来指定绘图区的大小：

``` js
gl.viewport(0, 0, canvas.width, canvas.height)
```

通常就是 canvas 的像素长宽（而不是 CSS 长宽）。

一般页面变化时要修改：

``` js
const resize = (canvas) => {
  // 获取 css 实际渲染尺寸
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
 
  // 检查尺寸是否相同
  if (canvas.width != displayWidth || canvas.height != displayHeight) {
    // 设置为相同的尺寸
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }
}

const frame = () => {
  // ...
  resize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
}
```

你可以获取当前机器上的最大视口：

``` js
gl.getParameter(gl.MAX_VIEWPORT_DIMS)
```

也可以获取当前的视口大小：

``` js
gl.getParameter(gl.VIEWPORT)
```



> 扩展知识：ThreeJS 对尺寸变化的处理方式是修改 renderer 的 size，以及修改 camera 的宽高比并更新投影矩阵。



# 3. WebGPU 中配置 canvas 的连接

在一个常规的 WebGPU 渲染程序中，如果要显式绘制到 canvas 上，那就要让 canvas 作为一张纹理，附着到渲染通道的颜色附件上。

``` js
// 这一步在请求设备对象之后就可以进行了
const context = canvasRef.current.getContext('webgpu');
const presentationFormat = context.getPreferredFormat(adapter)

const devicePixelRatio = window.devicePixelRatio || 1
const presentationSize = [
  canvasRef.current.clientWidth * devicePixelRatio,
  canvasRef.current.clientHeight * devicePixelRatio,
]

// 使用设备对象配置 canvas，让它变成合适的纹理
context.configure({
  device,
  format: presentationFormat,
  size: presentationSize,
})
```

然后在渲染通道编码器就可以用 canvas 这个纹理了：

``` js
const frame = () => {
  // ...
  
  // 渲染的每一帧，获取新的纹理和视图绑定至渲染通道
  const textureView = context.getCurrentTexture().createView()
  const renderPassDescriptor = {
    colorAttachments: [
      {
        view: textureView,
        loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        storeOp: 'store',
      },
    ],
  }
  
  // ... draw
  
  requestAnimationFrame(frame)
}
```

也许你会问，为什么要这么复杂？这跟 WebGPU 的使命有关，前面说了，WebGPU 更专注于 GPU 本身，而不是一个简单的绘图 API，在 WebGPU 中，渲染绘图不再是第一优先级，调用 WebGPU 的最大意义就是可以通过统一的 API 访问 GPU 的计算核心。

每当调用 `configure()` 方法去配置 canvas 纹理时，先前的纹理对象就会被销毁，并重新生成一个，适合窗口缩放时进行。

当然，你也可以使用 `context.unconfigure()` 方法仅取消配置，不再生成纹理。

同一个配置前提下，`getCurrentTexture()` 返回的纹理总是同一个。

如果你补显式指定配置参数的 `size`，那么内部会默认使用 canvas 的绘图长宽。如果你设置的长宽与 canvas 的绘图长宽不一致，那么它会帮你缩放到 canvas 的长宽。

## 关于改变 canvas 大小后的行为

改变 canvas 的大小，可以是改变其 CSS 渲染大小，也可以改变它的绘制长宽。

规范给了一个简单的例子，使用 `ResizeObserver` API 来监听 canvas 的大小，并重新配置 canvas 纹理：

``` js
const canvas = document.createElement('canvas')
const context =  canvas.getContext('webgpu')

const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    // 跳过非 canvas 目标
    if (entry.target != canvas) { 
      continue
    }
    // 为 webgpu 重新配置 canvas 纹理
    context.configure({
      device: gpuDevice,
      format: context.getPreferredFormat(gpuAdapter),
      size: {
        // 获取到新的长宽
        width: entry.devicePixelContentBoxSize[0].inlineSize,
        height: entry.devicePixelContentBoxSize[0].blockSize,
      }
    })
  }
})

// 仅观察 canvas
resizeObserver.observe(canvas)
```

