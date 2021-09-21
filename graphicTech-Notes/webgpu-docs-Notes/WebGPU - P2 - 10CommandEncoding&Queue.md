介绍原文 11 章、部分 12 章和 17 章的内容。

# 1 指令缓存：GPUCommandBuffer

指令缓存（又译作命令缓冲区），`GPUCommandBuffer`，是一个能事先存储 GPU 指令的存储容器。它可以提交给 [GPUQueue]() 执行。每个 GPU 指令代表一个要被 GPU 执行的任务，可以是绘图、设置数据、复制资源等。

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUCommandBuffer {
  readonly attribute Promise<double> executionTime;
};
GPUCommandBuffer includes GPUObjectBase;
```

它有一个 resolve 值是 double 数值的 Promise，其 resolve 值是指令缓存上的预存 GPU 指令的执行时间。

如果在创建指令编码器时，其参数对象的 `measureExecutionTime` 若为 true 才有效，若为 false，这个 Promise 会 reject，你可以捕获一个 `OperationError` 错误。

## 如何创建

调用 [指令编码器](#2 指令编码器：GPUCommandEncoder) 的 `finish` 方法，即可获取指令缓存对象。它一般用来提交给队列：

``` js
device.queue.submit([
  commandEncoder.finish()
])
```



# 2 指令编码器：GPUCommandEncoder

用途：①创建通道编码器；②复制 GPUBuffer/GPUTexture；③调试、查询等其他功能（略）

本文主要介绍常用的 ①、② 两种功能。

注意，指令编码器用完并提交给队列后，它就变得不再可用。

> 扩展阅读：[Metal 中的指令编码器](https://developer.apple.com/documentation/metal/mtlcommandencoder)

它的 WebIDL 定义如下：

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUCommandEncoder {
    GPURenderPassEncoder beginRenderPass(GPURenderPassDescriptor descriptor);
    GPUComputePassEncoder beginComputePass(optional GPUComputePassDescriptor descriptor = {});

    undefined copyBufferToBuffer(
        GPUBuffer source,
        GPUSize64 sourceOffset,
        GPUBuffer destination,
        GPUSize64 destinationOffset,
        GPUSize64 size);

    undefined copyBufferToTexture(
        GPUImageCopyBuffer source,
        GPUImageCopyTexture destination,
        GPUExtent3D copySize);

    undefined copyTextureToBuffer(
        GPUImageCopyTexture source,
        GPUImageCopyBuffer destination,
        GPUExtent3D copySize);

    undefined copyTextureToTexture(
        GPUImageCopyTexture source,
        GPUImageCopyTexture destination,
        GPUExtent3D copySize);

    undefined pushDebugGroup(USVString groupLabel);
    undefined popDebugGroup();
    undefined insertDebugMarker(USVString markerLabel);

    undefined writeTimestamp(GPUQuerySet querySet, GPUSize32 queryIndex);

    undefined resolveQuerySet(
        GPUQuerySet querySet,
        GPUSize32 firstQuery,
        GPUSize32 queryCount,
        GPUBuffer destination,
        GPUSize64 destinationOffset);

    GPUCommandBuffer finish(optional GPUCommandBufferDescriptor descriptor = {});
};
GPUCommandEncoder includes GPUObjectBase;
```



## 2.1 如何创建

由设备对象的 `createCommandEncoder` 方法创建

``` js
const commandEncoder = device.createCommandEncoder()
```

它有一个可选的参数对象，类型是 `GPUCommandEncoderDescriptor`，一个 JavaScript Object：

``` web-idl
dictionary GPUCommandEncoderDescriptor : GPUObjectDescriptorBase {
  boolean measureExecutionTime = false;
};
```

它的用途在指令缓存的创建小节已介绍过，可选属性 `measureExecutionTime` 表示是否可以测量指令的运行时间。



## 2.2 用途：启动/创建一个可编程通道

通过指令编码器的 `beginRenderPass` 和 `beginComputePass` 可以分别启动/创建一个渲染通道 或 计算通道，这两个方法的返回值自然就是渲染通道编码器（GPURenderPassEncoder）和计算通道编码器（GPUComputePassEncoder）。

``` js
// 渲染通道编码器
const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)

// 计算通道编码器
const computeEncoder = commandEncoder.beginComputePass()
```

其中，渲染通道编码器所需的参数对象 `renderPassDescriptor` 的细节见通道编码器文章。

指令编码器不负责通道编码器的结束，而是由通道编码器自己结束。



## 2.2 用途：缓存复制

即 `copyBufferToBuffer` 方法，用于 GPUBuffer 之间的拷贝。

``` web-idl
undefined copyBufferToBuffer(
  GPUBuffer source,
  GPUSize64 sourceOffset,
  GPUBuffer destination,
  GPUSize64 destinationOffset,
  GPUSize64 size
);
```

即从 `source` 复制到 `destination`，在 Buffer 一文中有简略提及它与直接 map/unmap 来赋予数据的差异，那就是这个方法是在 GPU 中操作，而 map/unmap 直接写入是在 CPU 端操作 GPUBuffer 的数据。

### 举例

``` js
const gpuWriteBuffer = device.createBuffer({ /* 用于写 */})
const gpuReadBuffer = device.createBuffer({ /* 用于读 */})

// 从一个复制到另一个
copyEncoder.copyBufferToBuffer(
  gpuWriteBuffer /* 源显存（对象） */,
  0 /* 起始字节（从哪开始读） */,
  gpuReadBuffer /* 目标显存（对象） */,
  0 /* 起始字节（从哪开始写） */,
  4 /* 复制多大的内容，单位 byte */
);
```



## 2.3 用途：图像/纹理复制

主要是 `copyBufferToTexture`、`copyTextureToBuffer`、`copyTextureToTexture` 方法，用于 GPUBuffer 和 GPUTexture、GPUTexture 和 GPUTexture 之间的复制。

需要用到 `GPUImageCopyBuffer`、`GPUImageCopyTexture` 和 `GPUExtent3D` 这三种 dictionary 的定义。

### 方法定义

不嫌麻烦，从上面 GPUCommandEncoder 再复制一次定义。

``` web-idl
undefined copyBufferToTexture(
  GPUImageCopyBuffer source,
  GPUImageCopyTexture destination,
  GPUExtent3D copySize
);

undefined copyTextureToBuffer(
  GPUImageCopyTexture source,
  GPUImageCopyBuffer destination,
  GPUExtent3D copySize
);

undefined copyTextureToTexture(
  GPUImageCopyTexture source,
  GPUImageCopyTexture destination,
  GPUExtent3D copySize
);
```

它们作用的级别是指令级别，是被安排在指令队列上的，即 GPU 中的操作，而不是在 CPU 端，这一点与 `copyBufferToBuffer` 是一样的。

每个方法都有合规性检验，主要是对参数进行校验，就不展开了。这里用到了三个类型：

### GPUImageCopyBuffer 类型

``` web-idl
dictionary GPUImageCopyBuffer : GPUImageDataLayout {
  required GPUBuffer buffer;
};
```

很简单，它就一个普通的 JavaScript 对象，有一个 `GPUBuffer` 类型的 buffer 字段。

### GPUImageCopyTexture 类型

``` web-idl
dictionary GPUImageCopyTexture {
  required GPUTexture texture;
  GPUIntegerCoordinate mipLevel = 0;
  GPUOrigin3D origin = {};
  GPUTextureAspect aspect = "all";
};
```

这个就稍显复杂，除了必选的 `GPUTexture` 类型的 texture 字段外，还有三个可选参数：

- `mipLevel`，unsigned long 类型，指定后，就复制对应的多级纹理；
- `origin`，`GPUOrigin3D` 类型，指定纹理的复制起点，此处忽略定义说明，有需要的读者可自行查阅文档，比较简单；
- `aspect`，`GPUTextureAspect` 类型，指定要复制纹理的什么方面，在纹理一文中有介绍

### GPUExtent3D 类型

``` web-idl
dictionary GPUExtent3DDict {
  required GPUIntegerCoordinate width;
  GPUIntegerCoordinate height = 1;
  GPUIntegerCoordinate depthOrArrayLayers = 1;
};
typedef (sequence<GPUIntegerCoordinate> or GPUExtent3DDict) GPUExtent3D;
```

它有两种定义，一种是 TypeScript 中的 `number[]`；

另一种是 `GPUExtent3DDict` 类型：

- `width` 表示范围宽度，必须传递
- `height` 表示范围高度，默认是 1
- `depthOrArrayLayers` 表示深度或者层数，默认是 1

意思是，你可以直接传递一个数组，也可以传递一个 key-value 对象来表示各个维度所需的范围。



# 3 指令队列：GPUQueue

它保存 [指令缓存](#1 指令缓存：GPUCommandBuffer)，主要负责提交指令缓存到 GPU 上。

指令队列对象是设备对象的一个属性，不可以由用户创建。

上述三个方法的定义与 `GPUQueue` 类型定义如下：

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUQueue {
  undefined submit(sequence<GPUCommandBuffer> commandBuffers);

  Promise<undefined> onSubmittedWorkDone();

  undefined writeBuffer(
    GPUBuffer buffer,
    GPUSize64 bufferOffset,
    [AllowShared] BufferSource data,
    optional GPUSize64 dataOffset = 0,
    optional GPUSize64 size
  );

  undefined writeTexture(
    GPUImageCopyTexture destination,
    [AllowShared] BufferSource data,
    GPUImageDataLayout dataLayout,
    GPUExtent3D size
  );

  undefined copyExternalImageToTexture(
    GPUImageCopyExternalImage source,
    GPUImageCopyTextureTagged destination,
    GPUExtent3D copySize
  );
};
GPUQueue includes GPUObjectBase;
```

其中，

- `submit` 方法用于提交一个指令缓存数组。
- `onSubmittedWorkDone` 方法返回一个 Promise，一旦所有目前为止提交的指令缓存数组中每一个指令缓存都处理完成，它就会 resolve，只不过没有 resolve 值。

除了挨个执行指令缓存器上的指令外，队列对象本身还可以自己就执行一些操作，例如：

- writeTexture：写入纹理
- writeBuffer：写入缓存
- copyExternalImageToTexture：从外部图像写数据到纹理

等操作。

其中：

writeTexture 方法需要额外用到 GPUImageCopyTexture、GPUImageDataLayout、GPUExtent3D 类型；copyExternalImageToTexture 需要用到 GPUImageCopyExternalImage、GPUImageCopyTextureTagged 和 GPUExtent3D 类型。

需要注意的是，这三个写数据的操作的等级是队列级别，与单个编码后的指令（即指令缓存上的指令）是地位均等的，只不过指令提交执行是异步，而这三个操作是同步的。



## 3.1 writeBuffer方法：写缓存

它允许把 `BufferSource` 类型的数据 `data`，写入到 `GPUBuffer` 对象中。

允许指定数据的 offset 和 size、GPUBuffer 的 offset。

`BufferSource` 是一种联合类型，在 JavaScript 中，定义为 `ArrayBuffer`、所有类型数组、`DataView` 的联合类型。



## 3.2 写纹理数据

写纹理数据有两个方法：

- `writeTexture` 方法将 `BufferSource`（3.1 小节有提及） 按 [GPUImageDataLayout](#GPUImageDataLayout 类型) 类型的对象描述的数据布局，写入由 [GPUImageCopyTexture](#GPUImageCopyTexture 类型) 描述的纹理对象中；
- `copyExternalImageToTexture` 方法将 [GPUImageCopyExternalImage](#GPUImageCopyExternalImage 类型) 对象描述的外部数据源（HTMLCanvasElement、ImageBitmap等），写入到 [GPUImageCopyTextureTagged](#GPUImageCopyTextureTagged 类型) 对象描述的纹理对象中



### GPUImageDataLayout 类型

``` web-idl
dictionary GPUImageDataLayout {
  GPUSize64 offset = 0;
  GPUSize32 bytesPerRow;
  GPUSize32 rowsPerImage;
};
```

它表示一张图像在字节数组中的样子。`offset` 表示从数据源的什么位置读取一张图像；`bytesPerRow` 表示图像一行像素占多大内容；`rowsPerImage` 表示图像有多少行。



### GPUImageCopyExternalImage 类型

``` web-idl
dictionary GPUImageCopyExternalImage {
  required (ImageBitmap or HTMLCanvasElement or OffscreenCanvas) source;
  GPUOrigin2D origin = {};
};
```

此类型的对象描述一个外部图像数据。其中，`source` 传入外部图像对象，一般常用的是前两个；`origin` 表示复制的原点，相对于 source 而言。



### GPUImageCopyTextureTagged 类型

它继承自 [GPUImageCopyTexture](#GPUImageCopyTexture 类型) 类型：

``` web-idl
dictionary GPUImageCopyTextureTagged : GPUImageCopyTexture {
  GPUPredefinedColorSpace colorSpace = "srgb";
  boolean premultipliedAlpha = false;
};
```

其中，`colorSpace` 字段描述外部数据数据编码的颜色空间，目前只能是 `"srgb"`；`premultipliedAlpha` 默认值是 false，意思是，是否将数据源中的透明度与 rgb 颜色相乘再写入纹理。使用了 WebGL 的 canvas 可以用 `WebGLContextAttributes` 控制，Canvas2D 的 canvas 总是预先相乘，ImageBitmap 使用 ImageBitmapOptions 控制。

不过这两个参数是可选的，它们均有默认值，所以通常只需设置好 `GPUImageCopyTexture` 的部分即可。



### 举例

以 copyExternalImageToTexture 方法为例，写入外部 webp 图片纹理：

``` js
const img = document.createElement('img')
img.src = 'texture.webp'
await img.decode()
const imageBitmap = await createImageBitmap(img)
const texture = device.createTexture({
  size: [img.width, img.height], // 256, 256
  format: "rgba8unorm",
  usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST
})

device.queue.copyExternalImageToTexture({
  imageBitmap: imageBitmap
}, {
  texture: texture
}, [img.width, img.height, 1])
```



# 扩展阅读

[Metal 的指令组织和执行模式](https://colin19941.gitbooks.io/metal-programming-guide-zh/content/Command_Organization_and_Execution_Model.html)

