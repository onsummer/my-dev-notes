Pass，通道。

通道允许使用多个 Pipelines。

Pipelines 允许切换不同的资源（bindGroup、VBO）。

通道在设置好 Pipelines （setPipeline）和资源绑定（setVertexBuffer、setBindGroup）、绘制命令（draw）触发之后，要进行编码（endPass），编码完成即可告诉指令编码器完成一个通道编码器的编码，并将指令编码器提交到渲染队列。

通道有两种

``` 
GPUProgrammablePassEncoder
├ GPURenderPassEncoder
└ GPUComputePassEncoder
```

本文介绍原文 13、14、15 章的部分内容。

# 可编程通道编码器：GPUProgrammablePassEncoder

简称为通道编码器，它有两种子类型，渲染通道编码器 `GPURenderPassEncoder` 和计算通道编码器 `GPUComputePassEncoder`。

通道编码器的主要功能就是将不同的 pipeline 和绑定组根据实际需要排列组合在一起，完成一帧完整的渲染或一次完整的计算。

通道编码器的主要功能是，设置（切换）绑定组、VBO和设置（切换）管线。除此之外，还可以进行调试，但是调试并不作为此文关注的内容，有兴趣的读者可以自行查阅文档。

## 创建通道编码器

由某个指令编码器创建，具体见下文两种编码器的创建小节。

## 设置绑定组 setBindGroup

此方法是每一种具体的通道编码器都具备的功能，有两种重载

- setBindGroup(index, bindGroup, dynamicOffsets)
- setBindGroup(index, bindGroup, dynamicOffsetsData, dynamicOffsetsDataStart, dynamicOffsetsDataLength)

其目的都是向位于 `index` 位置的 bindGroupLayout 传递 GPUBindGroup 对象 `bindGroup`，后面的动态偏移值、动态偏移数据等高级用法见官方文档。

通常，只用到前面两个参数即可。



# 1 渲染通道编码器

## 1.1 创建

使用指令编码器（GPUCommandEncoder）的 `beginRenderPass` 方法即可创建一个渲染通道编码器：

``` js
const renderPassEncoder = commandEncoder.beginRenderPass({
  /* {}: GPURenderPassDescriptor */
})
```

参数对象是 `GPURenderPassDescriptor` 类型的，它不能是空且必须传递。

``` web-idl
dictionary GPURenderPassDescriptor : GPUObjectDescriptorBase {
  required sequence<GPURenderPassColorAttachment> colorAttachments;
  GPURenderPassDepthStencilAttachment depthStencilAttachment;
  GPUQuerySet occlusionQuerySet;
};
```

它有一个必选的数组参数 `colorAttachments`，数组元素类型是 `GPURenderPassColorAttachment`，表示其颜色附件，此数组长度≤8且＞0；若为 0，那么深度模板附件参数 `depthStencilAttachment` 不能为 null。

还有两个可选参数，`GPURenderPassDepthStencilAttachment` 类型的 `depthStencilAttachment`，表示其深度纹理附件；`GPUQuerySet` 类型的 `occlusionQuerySet`，表示一些查询有关的信息集。



### 1.1.1 颜色附件

``` web-idl
dictionary GPURenderPassColorAttachment {
  required GPUTextureView view;
  GPUTextureView resolveTarget;

  required (GPULoadOp or GPUColor) loadValue;
  required GPUStoreOp storeOp;
};
```

颜色附件，是指渲染管线输出的颜色保存到什么地方去的一种结果容器。

而颜色附件对象，是在渲染通道编码器创建时的一个参数，用于描述。它有三个必选字段：

- `view`，`GPUTextureView` 类型，指颜色最终要输出到哪个纹理（视图）对象上；
- `loadValue`，`GPULoadOp` 或 `GPUColor` 类型，指定初始化时的行为或颜色；
- `storeOp`，`GPUStoreOp` 类型，指定渲染通道执行结束后对 view 的存储行为

还有一个可选参数 `resolveTarget`，`GPUTextureView` 类型，它用来接收当 view 使用了多重采样时的颜色输出结果，即配合多重采样抗锯齿技术使用。若设置了 `resolveTarget`，即使用了多重采样，那么 view 是“中途的”，而 resolveTarget 一般会设为 Canvas 的纹理视图。

GPULoadOp、GPUStoreOp 两个类型见下： 

#### GPULoadOp：初始化行为

它是一个单字符串值枚举：

``` web-idl
enum GPULoadOp {
  "load"
};
```

如果为颜色附件的 loadValue 指定了 "load"，那么渲染通道开始时，颜色附件的初始颜色会用颜色附件上已有的颜色。

注意，在某些设备（譬如移动端）上，对 loadValue 使用 `GPUColor` 来初始化会好得多。



#### GPUStoreOp：存储行为

``` web-idl
enum GPUStoreOp {
  "store",
  "discard"
};
```

"store" 表示通道结束后，颜色保存，"discard" 表示通道结束后，颜色丢弃。



### 1.1.2 深度模板附件

``` web-idl
dictionary GPURenderPassDepthStencilAttachment {
  required GPUTextureView view;

  required (GPULoadOp or float) depthLoadValue;
  required GPUStoreOp depthStoreOp;
  boolean depthReadOnly = false;

  required (GPULoadOp or GPUStencilValue) stencilLoadValue;
  required GPUStoreOp stencilStoreOp;
  boolean stencilReadOnly = false;
};
```

深度模板附件是渲染通道的第二大部分，负责保存通道结束后输出的深度和模板值。

`view` 参数与颜色附件的作用类似，提供容器。

`depthLoadValue`、`stencilLoadValue` 与颜色附件中的 `loadValue` 作用也类似，区别在类型不大一样。

`depthStoreOp`、`stencilStoreOp` 与颜色附件中的 `storeOp` 也是类似的。

多出来两个可选字段 `depthReadOnly`、`stencilReadOnly` 默认值是 false，它们的意思是指示 `view` 这个纹理视图中，深度/模板的部分是否是只读的。

对深度模板附件的合规性校验省略，也不复杂，有兴趣的读者可自己到规范文档中查阅。



### 1.1.3 译者注

渲染通道与 WebGL 中的 Framebuffer 非常相似。



## 1.2 触发绘制功能相关的方法

以下方法均在渲染通道编码器上。

### setPipeline 方法

设置（或者说切换到也行）管线的方法，参数是一个 `GPURenderPipeline` 对象。

``` web-idl
undefined setPipeline(GPURenderPipeline pipeline);
```



### setVertexBuffer 方法

这个是设置顶点数据（VertexBuffer）的方法。

方法签名：

``` web-idl
undefined setVertexBuffer(
  GPUIndex32 slot, 
  GPUBuffer buffer, 
  optional GPUSize64 offset = 0, 
  optional GPUSize64 size
);
```

`slot` 参数，指的是顶点着色器入口函数中的 location，必选，且＜设备对象的限制列表中的 `maxVertexBuffers`；

`buffer` 参数，即 VertexBuffer 本身，其 `usage` 属性要包括 `VERTEX`，必选；

`offset` 指的是从哪个字节开始取顶点数据，必须是 4 的倍数；

`size` 通常就是指 VertexBuffer 的字节大小了，如果不传递，那就默认是 `buffer.size - offset`。



### setBindGroup 方法

这个方法是 `GPUProgrammalePassEncoder` 父类型上的方法，用法上是一致的，主要就是传递绑定组。具体见上文 [设置绑定组 setBindGroup](#设置绑定组 setBindGroup)。



### setIndexBuffer 方法

这个是设置索引数据用的方法，最经典的例子就是四个点构成一个四边形或者六个点构成一个四边形的问题。

方法签名：

``` web-idl
undefined setIndexBuffer(
  GPUBuffer buffer, 
  GPUIndexFormat indexFormat, 
  optional GPUSize64 offset = 0, 
  optional GPUSize64 size
);
```

需要注意，这个 `buffer` 的 `usage` 属性必须包括 `INDEX`，而且 `offset` 必须是 sizeof(indexFormat) 的倍数。

只有用到索引数据来索引顶点时，才会用到这个方法。



### draw 方法

draw 方法的签名如下：

``` web-idl
undefined draw(
  GPUSize32 vertexCount, 
  optional GPUSize32 instanceCount = 1,
  optional GPUSize32 firstVertex = 0, 
  optional GPUSize32 firstInstance = 0
);
```

它用于触发绘制图元，`vertexCount` 即要绘制多少个顶点，`instanceCount` 表示要把这些顶点绘制多少次，`firstVertex` 表示从第几个开始绘制，`firstInstance` 表示从第几次开始绘制。

`instanceCount` 会影响到 WGSL 中的内置变量 `instance_index`，你可以从这个内置变量获取当前绘制的次数，从而选择不同的参数进行绘制。

> 这个方法与 WebGL 的 gl.drawArray 方法类似。



## 1.3 其他方法

渲染通道编码器上还有其他方法，不一一列举说明，有余力的读者建议在用到的时候查阅文档。



## 1.4 结束通道编码

完成对渲染通道编码器的任务安排和数据设置后，调用其 `endPass` 方法结束此编码器的编码任务。一旦调用此方法，渲染通道编码器将不能再使用。



## 1.5 常见流程

``` js
// 启动（创建）通道
const renderPassEncoder = commandEncoder.beginRenderPass()

// 第一道绘制
renderPassEncoder.setPipeline(renderPipeline_0)
renderPassEncoder.setBindGroup(0, bindGroup_0)
renderPassEncoder.setBindGroup(1, bindGroup_1)
renderPassEncoder.setVertexBuffer(0, vbo, 0, size)
renderPassEncoder.draw(vertexCount)

// 第二道绘制
renderPassEncoder.setPipeline(renderPipeline_1)
renderPassEncoder.setBindGroup(1, another_bindGroup)
renderPassEncoder.draw(vertexCount)

// 结束通道编码
renderPassEncoder.endPass()
```



# 2 计算通道编码器

计算通道编码器可以组合多个计算管线完成一个复杂的计算任务。

其接口类型是：

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUComputePassEncoder {
  undefined setPipeline(GPUComputePipeline pipeline);
  undefined dispatch(GPUSize32 x, optional GPUSize32 y = 1, optional GPUSize32 z = 1);
  undefined dispatchIndirect(GPUBuffer indirectBuffer, GPUSize64 indirectOffset);

  undefined beginPipelineStatisticsQuery(GPUQuerySet querySet, GPUSize32 queryIndex);
  undefined endPipelineStatisticsQuery();

  undefined writeTimestamp(GPUQuerySet querySet, GPUSize32 queryIndex);

  undefined endPass();
};
GPUComputePassEncoder includes GPUObjectBase;
GPUComputePassEncoder includes GPUProgrammablePassEncoder;
```

除了与渲染通道编码器类似的 `setPipeline` 方法之外，最常用的方法是 `dispatch` 和 `endPass`，其余方法的作用属于比较高级的内容，如有需要的读者可自行查阅文档，本节会着重介绍 `dispatch` 方法。

## 2.1 创建

使用指令编码器的 `beginComputePass` 即可创建一个计算通道编码器：

``` js
const computePassEncoder = commandEncoder.beginComputePass({
  /* {}?: GPUComputePassDescriptor */
})
```

参数对象的类型是 `GPUComputePassEncoder` 是可选的，你可以不传递。

当然，这个类型啥都没有：

``` web-idl
dictionary GPUComputePassDescriptor : GPUObjectDescriptorBase {
};
```



## 2.2 调度（dispatch）

与渲染管线的 `draw` 方法地位一样，都是触发执行管线定制好的计算的重要函数。当然在执行这个函数之前，要调用计算通道编码器的 `setPipeline` 方法来指定计算管线。

`dispatch`，调度，是 WebGPU 通用计算中的一种操作，它负责编码一些计算指令，让计算着色器对某一块数据进行计算。

它有三个参数：x、y、z，其中 x 必须传递，其他两个是可选的，均为 unsigned long 类型的数字。

它们的含义是，在三个维度上进行多少次计算着色器入口函数（此时，入口函数被称为核函数）的调用。

### 译者注

有人可能会疑惑，调度多少次为什么不是单个参数？这就涉及到计算着色器入口中的一个 attribute - `workgroup_size` 了。

`workgroup_size` 指定三个维度上要申请多少个 GPU 核心进行运算，这代表了核函数的运算能力大小。

设计成三个维度的，是为了方便与矩阵、向量、多维纹理这些对象进行通用计算。

举例，若 `workgroup_size` 指定三个维度的 GPU 核心数是 `(4, 4, 3)`，那么一共有 4×4×3 = 48 个核心参与计算。

那么此时如何进行调度（dispatch）呢？

这取决于你的数据尺寸。如果你的数据是一个三通道的纹理图像，它的尺寸是 256×256，如果红绿蓝分量作为 z 维度的话，那么它的尺寸可以表示成 256×256×3，你要用上述 `workgroup_size(4, 4, 3)` 尺寸的核函数进行计算，显然在 x 和 y 维度上不够，在 z 维度上刚刚好。所以，此时调度的次数应为

- x = 256 / 4 = 64
- y = 256 / 4 = 64
- z = 3 / 3 = 1

当然，你也可以扩大 `workgroup_size`，这取决于你的设备对象限制列表中有关的限制值。

那么在着色器中如何知晓核函数跑在哪一个核心呢？其内置变量 `global_invocation_id` 是一个三维向量，它的三个分量值就告诉核函数当前跑在 `workgroup_size` 申请的核心中的哪一个。

由于并行运算的特点，如果各个方向上的 `dispatch` 数超过 1，那核函数是不知道当前的调度次数的，所以需要认真设计并行通用运算这一点（希望我阅读 WGSL 后自己打脸）。

## 2.3 结束通道编码

和渲染通道编码器一样，通过调用计算通道编码器的 `endPass` 方法完成编码。一旦完成编码，这个计算通道编码器对象将不再可用，即不能再进行设置管线、绑定资源等操作。