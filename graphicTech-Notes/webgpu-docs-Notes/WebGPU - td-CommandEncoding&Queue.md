介绍原文 11 章、部分 12 章和 17 章的内容

# 1 指令缓存器：GPUCommandBuffer



# 2 指令编码器：GPUCommandEncoder

用途：①创建通道编码器；②作为复制 GPUBuffer/GPUTexture 的指令器；③调试、查询等其他功能（略）

指令编码器用完就得扔，一次性用品。

## 如何创建



## 用途：缓存复制

copyBufferToBuffer 方法，用于 GPUBuffer 之间的拷贝



## 用途：图像/纹理复制

copyBufferToTexture、copyTextureToBuffer、copyTextureToTexture 方法，用于 GPUBuffer 和 GPUTexture 之间的复制

需要用到 GPUImageCopyBuffer、GPUImageCopyTexture 和 GPUExtent3D 这三种类型的定义。



# 3 指令队列：GPUQueue

用途：挨个执行 GPUCommandBuffer

除了挨个执行指令缓存器上的指令外，队列对象本身还可以自己就执行一些操作，例如写纹理 writeTexture、写缓存 writeBuffer、从外部图像写数据到纹理 copyExternalImageToTexture 等操作。

其中，writeTexture 方法需要额外用到 GPUImageCopyTexture、GPUImageDataLayout、GPUExtent3D 类型，copyExternalImageToTexture 需要用到 GPUImageCopyExternalImage、GPUImageCopyTextureTagged 和 GPUExtent3D 类型。