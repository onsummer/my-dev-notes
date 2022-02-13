# 1. 什么是缓冲映射

就不给定义了，直接简单的说，映射（Mapping）后的某块显存，就能被 CPU 访问。

三大图形 API（D3D12、Vulkan、Metal）的 Buffer（指显存）映射后，CPU 就能访问它了，此时注意，GPU 仍然可以访问这块显存。这就会导致一个问题：IO冲突，这就需要程序考量这个问题了。

WebGPU 禁止了这个行为，改用传递“所有权”来表示映射后的状态，颇具 Rust 的哲学。每一个时刻，CPU 和 GPU 是单边访问显存的，也就避免了竞争和冲突。

当 JavaScript 请求映射显存时，所有权并不是马上就能移交给 CPU 的，GPU 这个时候可能手头上还有别的处理显存的操作。所以，`GPUBuffer` 的映射方法是一个异步方法：

``` js
const someBuffer = device.createBuffer({ /* ... */ })
await someBuffer.mapAsync(GPUMapMode.READ, 0, 4) // 从 0 开始，只映射 4 个字节

// 之后就可以使用 getMappedRange 方法获取其对应的 ArrayBuffer 进行缓冲操作
```

不过，解映射操作倒是一个同步操作，CPU 用完后就可以解映射：

``` js
somebuffer.unmap()
```

注意，`mapAsync` 方法将会直接在 WebGPU 内部往设备的默认队列中压入一个操作，此方法作用于 WebGPU 中三大时间轴中的 **队列时间轴**。而且在 mapAsync 成功后，内存才会增加（实测）。

当向队列提交指令缓冲后（此指令缓冲的某个渲染通道要用到这块 GPUBuffer），内存上的数据才会提交给 GPU（猜测）。

由于测试地不多，我在调用 `destroy` 方法后并未显著看到内存的变少，希望有朋友能测试。



## 创建时映射

可以在创建缓冲时传递 `mappedAtCreation: true`，这样甚至都不需要声明其 usage 带有 `GPUBufferUsage.MAP_WRITE`

``` js
const buffer = device.createBuffer({
  usage: GPUBufferUsage.UNIFORM,
  size: 256,
  mappedAtCreation: true,
})
// 然后马上就可以获取映射后的 ArrayBuffer
const mappedArrayBuffer = buffer.getMappedRange()

/* 在这里执行一些写入操作 */

// 解映射，还管理权给 GPU
buffer.unmap()
```



# 2 缓冲数据的流向

## 2.1 CPU 至 GPU

JavaScript 这端会在 rAF 中频繁地将大量数据传递给 GPUBuffer 映射出来的 ArrayBuffer，然后随着解映射、提交指令缓冲到队列，最后传递给 GPU.

上述最常见的例子莫过于传递每一帧所需的 VertexBuffer、UniformBuffer 以及计算通道所需的 StorageBuffer 等。

使用队列对象的 `writeBuffer` 方法写入缓冲对象是非常高效率的，但是与用来写入的映射后的一个 GPUBuffer 相比，`writeBuffer` 有一个额外的拷贝操作。推测会影响性能，虽然官方推荐的例子中有很多 writeBuffer 的操作，大多数是用于 UniformBuffer 的更新。



## 2.2 GPU 至 CPU

这样反向的传递比较少，但也不是没有。譬如屏幕截图（保存颜色附件到 ArrayBuffer）、计算通道的结果统计等，就需要从 GPU 的计算结果中获取数据。

譬如，官方给的从渲染的纹理中获取像素数据例子：

``` js
const texture = getTheRenderedTexture()

const readbackBuffer = device.createBuffer({
  usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  size: 4 * textureWidth * textureHeight,
})

// 使用指令编码器将纹理拷贝到 GPUBuffer
const encoder = device.createCommandEncoder()
encoder.copyTextureToBuffer(
  { texture },
  { buffer, rowPitch: textureWidth * 4 },
  [textureWidth, textureHeight],
)
device.submit([encoder.finish()])

// 映射，令 CPU 端的内存可以访问到数据
await buffer.mapAsync(GPUMapMode.READ)
// 保存屏幕截图
saveScreenshot(buffer.getMappedRange())
// 解映射
buffer.unmap()
```

