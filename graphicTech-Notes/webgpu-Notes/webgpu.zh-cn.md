# 1 介绍

图形处理单元，或者简写为 GPU，在个人计算中已经实现了丰富的渲染效果和并行计算（挖矿等）。WebGPU 是一个向 Web 端暴露了 GPU 硬件能力的 API。

WebGPU 借鉴了诸如 Vulkan、D3D12、Metal 等原生的 API。

WebGPU 跟 WebGL、OpenGL ES 毫无关系。

WebGPU 将物理GPU硬件视为 `GPUAdapter`。通过 `GPUDevice` 可以连接到一个 adapter。`GPUDevice`（设备）管理着有关资源以及  `GPUQueue`（GPU队列）。GPU队列执行一系列的命令。

GPUDevice 拥有能高速访问处理单元的显存。

`GPUBuffer` 和 `GPUTexture` 是显存背后真实的物理资源。

`GPUCommandBuffer` 和 `GPURenderBundle` 是用户命令的容器。

`GPUShaderModule` 包含了着色器代码。

其他资源，例如 `GPUSampler` 或 `GPUBindGroup`，配置了 GPU 如何使用上述物理资源的方法。

GPU 执行编码在 `GPUCommandBuffer` 中的各种命令，命令执行时所需的数据来自 `pipeline`。

`pipeline` 是一个混合了函数、可编程阶段的对象。

**可编程阶段** 执行着色器，着色器是一些 GPU 才能执行的特定设计出来的代码程序。

大多数 pipeline 的状态由 `GPURenderPipeline` 或 `GPUComputePipeline` 对象定义。在 pipeline 之外的状态将在编码命令时设置，例如 `beginRenderPass()` 或 `setBlendColor()`。

# 2 Malicious use considerations



# 3 基础知识

## 3.1 惯用法

### 3.1.1 点语法

### 3.1.2 内置对象

### 3.1.3 WebGPU 接口

### 3.1.4 对象描述

## 3.2 无效的内部对象与 Contagious Invalidity

## 3.3 坐标系统

WebGPU 的坐标系与 DirectX、Metal 的类似。

- NDC中，y轴朝上。x、y 轴值域均为 [-1, 1]，z 轴值域是 [0, 1]
- 帧缓存中，y轴朝下，视口坐标和像素坐标的原点均在左上角
- 窗口（像素）坐标与帧缓存的坐标是匹配的
- 纹理坐标，其原点对应内存中的纹理数据的起始位置

## 3.4 编程模型

## 3.5 核心内部对象

### 3.5.1 适配器

### 3.5.2 设备

## 3.6 可选功能

### 3.6.1 特点

### 3.6.2 局限性

就是设备的一些最大极限信息。

- maxTextureDimension1D

  8192

- maxTextureDimension2D

  8192

- maxTextureDimension3D

  2048

- maxTextureArrayLayers

  2048

- maxBindGroups

  4个

- maxDynamicUniformBuffersPerPipelineLayout

  8个

- maxDynamicStorageBuffersPerPipelineLayout

  4个

- maxSampledTexturesPerShaderStage

  16个

- maxSamplersPerShaderStage

  16个

- maxStorageBuffersPerShaderStage

  4个

- maxStorageTexturesPerShaderStage

  4个

- maxUniformBuffersPerShaderStage

  12个

- maxUniformBufferBindingSize

  16KB

- maxStorageBufferBindingSize

  128MB

- maxVertexBuffers

  8个

- maxVertexAttributes

  16个

- maxVertexBufferArrayStride

  2048 byte

#### 3.6.2.1 `GPUAdapterLimits`

```
[Exposed=Window]
interface GPUAdapterLimits {
    readonly attribute unsigned long maxTextureDimension1D;
    readonly attribute unsigned long maxTextureDimension2D;
    readonly attribute unsigned long maxTextureDimension3D;
    readonly attribute unsigned long maxTextureArrayLayers;
    readonly attribute unsigned long maxBindGroups;
    readonly attribute unsigned long maxDynamicUniformBuffersPerPipelineLayout;
    readonly attribute unsigned long maxDynamicStorageBuffersPerPipelineLayout;
    readonly attribute unsigned long maxSampledTexturesPerShaderStage;
    readonly attribute unsigned long maxSamplersPerShaderStage;
    readonly attribute unsigned long maxStorageBuffersPerShaderStage;
    readonly attribute unsigned long maxStorageTexturesPerShaderStage;
    readonly attribute unsigned long maxUniformBuffersPerShaderStage;
    readonly attribute unsigned long maxUniformBufferBindingSize;
    readonly attribute unsigned long maxStorageBufferBindingSize;
    readonly attribute unsigned long maxVertexBuffers;
    readonly attribute unsigned long maxVertexAttributes;
    readonly attribute unsigned long maxVertexBufferArrayStride;
};
```



#### 3.6.2.2 `GPUAdapterFeatures`

```
[Exposed=Window]
interface GPUAdapterFeatures {
    readonly setlike<GPUFeatureName>;
};
```



# 4 初始化

## 4.1 示例

暂空

## 4.2 `navigator.gpu`

## 4.3 GPU

*GPU* 是 WebGPU 的入口。

``` typescript
[Exposed=(Window, DedicatedWorker)]
interface GPU {
	Promise<GPUAdapter?> requestAdapter(optional GPURequestAdapterOptions options = {});
}
```

GPU 有这些方法：

- *requestAdapter(options)*
  - 说明：
  - this：
  - 参数：
  - 返回值：

请求一个 `GPUAdapter` 的例子：

``` js
const adapter = await navigator.gpu.requestAdapter(/* ... */)
const features = adapter.features
// ...
```

## 4.3.1 适配器（Adapter）的选择

*GPURequestAdapterOptions* 

## 4.4 GPUAdapter

GPU适配器（GPUAdapter）封装了一个适配器（见3.5.1），它描述了适配器的能力（功能与局限）。

使用 `requestAdapter()` 方法（navigator.gpu），可以获取 `GPUAdapter`。

``` typescript
interface GPUAdapter {
  readonly attribute DOMString name;
  [SameObject] readonly attribute GPUAdapterFeatures features;
  [SameObject] readonly attribute GPUAdapterLimits limits;
  Promise<GPUDevice> requestDevice(optional GPUDeviceDescriptor descriptor = {});
}
```

#### 4.4.1. `GPUDeviceDescriptor`

GPUDeviceDescriptor 描述了一个社保请求。

``` 
dictionary GPUDeviceDescriptor : GPUObjectDescriptorBase {
    sequence<GPUFeatureName> nonGuaranteedFeatures = [];
    record<DOMString, GPUSize32> nonGuaranteedLimits = {};
};
```



## 4.5 GPUDevice

`GPUDevice` 封装了一个设备（见3.5.2），并暴露了这个设备的功能。

`GPUDevice` 是创建 WebGPU 其他接口的顶级接口。

获取它的方法是 `requestDevice()`（使用GPUAdapter）

``` 
[Exposed=(Window, DedicatedWorker), Serializable]
interface GPUDevice : EventTarget {
    readonly attribute FrozenArray<GPUFeatureName> features;
    readonly attribute object limits;

    [SameObject] readonly attribute GPUQueue queue;

    undefined destroy();

    GPUBuffer createBuffer(GPUBufferDescriptor descriptor);
    GPUTexture createTexture(GPUTextureDescriptor descriptor);
    GPUSampler createSampler(optional GPUSamplerDescriptor descriptor = {});

    GPUBindGroupLayout createBindGroupLayout(GPUBindGroupLayoutDescriptor descriptor);
    GPUPipelineLayout createPipelineLayout(GPUPipelineLayoutDescriptor descriptor);
    GPUBindGroup createBindGroup(GPUBindGroupDescriptor descriptor);

    GPUShaderModule createShaderModule(GPUShaderModuleDescriptor descriptor);
    GPUComputePipeline createComputePipeline(GPUComputePipelineDescriptor descriptor);
    GPURenderPipeline createRenderPipeline(GPURenderPipelineDescriptor descriptor);
    Promise<GPUComputePipeline> createComputePipelineAsync(GPUComputePipelineDescriptor descriptor);
    Promise<GPURenderPipeline> createRenderPipelineAsync(GPURenderPipelineDescriptor descriptor);

    GPUCommandEncoder createCommandEncoder(optional GPUCommandEncoderDescriptor descriptor = {});
    GPURenderBundleEncoder createRenderBundleEncoder(GPURenderBundleEncoderDescriptor descriptor);

    GPUQuerySet createQuerySet(GPUQuerySetDescriptor descriptor);
};
GPUDevice includes GPUObjectBase;
```



# 5 缓存（缓冲）

## 5.1 GPUBuffer

## 5.2 创建

### 5.2.1 GPUBufferDescriptor

## 5.3 用途

## 5.4 解构

## 5.5 映射

# 6 纹理与纹理视图

todo

## 6.1 `GPUTexture`

```
[Serializable]
interface GPUTexture {
    GPUTextureView createView(optional GPUTextureViewDescriptor descriptor = {});

    undefined destroy();
};
GPUTexture includes GPUObjectBase;
```

### 6.1.1 创建纹理

``` 
dictionary GPUTextureDescriptor : GPUObjectDescriptorBase {
  required GPUExtent3D size;
  GPUIntegerCoordinate mipLevelCount = 1;
  GPUSize32 sampleCount = 1;
  GPUTextureDimension dimension = "2d";
  required GPUTextureFormat format;
  required GPUTextureUsageFlags usage;
};
```

```
enum GPUTextureDimension {
	"1d",
	"2d",
	"3d",
};
```

``` 
typedef [EnforceRange] unsigned long GPUTextureUsageFlags;
interface GPUTextureUsage {
  const GPUFlagsConstant COPY_SRC          = 0x01;
  const GPUFlagsConstant COPY_DST          = 0x02;
  const GPUFlagsConstant SAMPLED           = 0x04;
  const GPUFlagsConstant STORAGE           = 0x08;
  const GPUFlagsConstant RENDER_ATTACHMENT = 0x10;
};
```

函数如下：

``` 
createTexture(descriptor)
```

其参数对象 `descriptor` 如下：

| 参数名     | 类型                   | 是否可空 | 是否可选 | 描述                             |
| ---------- | ---------------------- | -------- | -------- | -------------------------------- |
| descriptor | `GPUTextureDescriptor` | no       | no       | 描述了一个 GPUTexture 如何被创建 |

返回一个 `GPUTexture` 对象。



## 6.2 GPUTextureView

## 6.3 TextureFormats

# 7 采样器

## 7.1 GPUSampler

## 7.2 创建

# 8 资源绑定

## 8.1 GPUBindGroupLayout

### 8.1.1 创建

通过 `GPUDevice.prototype.createBindGroupLayout()` 创建。

```
dictionary GPUBindGroupLayoutDescriptor : GPUObjectDescriptorBase {
    required sequence<GPUBindGroupLayoutEntry> entries;
};
```

`GPUBindGroupLayoutEntry` 描述了一个在着色器中能使用的资源。

```
typedef [EnforceRange] unsigned long GPUShaderStageFlags;
[Exposed=Window]
interface GPUShaderStage {
    const GPUFlagsConstant VERTEX   = 0x1;
    const GPUFlagsConstant FRAGMENT = 0x2;
    const GPUFlagsConstant COMPUTE  = 0x4;
};

dictionary GPUBindGroupLayoutEntry {
    required GPUIndex32 binding;
    required GPUShaderStageFlags visibility;

    GPUBufferBindingLayout buffer;
    GPUSamplerBindingLayout sampler;
    GPUTextureBindingLayout texture;
    GPUStorageTextureBindingLayout storageTexture;
};
```



## 8.2 GPUBindGroup

`GPUBindGroup` 定义了一组在着色器中使用的资源。

```
[Exposed=Window]
interface GPUBindGroup {
};
GPUBindGroup includes GPUObjectBase;
```

### 8.2.1 创建

通过 `GPUDevice.prototype.createBindGroup()` 创建。传入一个 `GPUBindGroupDescriptor` 对象。

```
dictionary GPUBindGroupDescriptor : GPUObjectDescriptorBase {
    required GPUBindGroupLayout layout;
    required sequence<GPUBindGroupEntry> entries;
};
```



## 8.3 GPUPipeLineLayout

# 9 着色器模块

## 9.1 GPUShaderModule

# 10 流水线

## 10.1 基本流水线

## 10.2 GPUComputePipeline

## 10.3 GPURenderPipeline

### 10.3.1 创建

### 10.3.2 图元裁剪

### 10.3.3 栅格化

栅格化，是指将装配好的图元映射到帧缓存的硬件处理阶段。**帧缓存**，是 `GPURenderPassEncoder` 的一个渲染附件。

首先，顶点裁剪并转换到 NDC（规范化设备坐标系统），令输出坐标是 p，那么 NDC 坐标如下计算：
$$
ndc(p) = vector(p.x / p.w, p.y / p.w, p.z / p.w)
$$
然后，将视口设为当前渲染通道的视口，设NDC坐标为 n，它将转为帧缓存坐标：
$$
frameBufferCoords(n) = vector(viewport.x + 0.5(n.x + 1) × viewport.width, viewport.y + 0.5×(n.y + 1) × viewport.height)
$$


### 10.3.4 无颜色输出

### 10.3.5 Alpha to Coverage

### 10.3.6 Sample Masking

### 10.3.7 图元状态

### 10.3.8 多重采样状态

### 10.3.9 片元状态

### 10.3.10 颜色目标状态

### 10.3.11 深度/模板状态

### 10.3.12 顶点状态

# 11 命令缓存

## 11.1 GPUCommandBuffer

# 12 命令编码

## 12.1 GPUCommandEncoder

## 12.2 通道编码

## 12.3 拷贝命令

## 12.4 Debug Markers

## 12.5 Queries

## 12.6 Finalization

# 13 可编程通道

## 13.1 Bind Groups

## 13.2 Debug Markers

# 14 计算通道

# 15 渲染通道

## 15.1 GPURenderPassEncoder

### 15.1.1 创建

``` 
dictionary GPURenderPassDescriptor : GPUObjectDescriptorBase {
    required sequence<GPURenderPassColorAttachment> colorAttachments;
    GPURenderPassDepthStencilAttachment depthStencilAttachment;
    GPUQuerySet occlusionQuerySet;
};
```

#### 15.1.1.1 颜色附件

``` 
dictionary GPURenderPassColorAttachment {
    required GPUTextureView view;
    GPUTextureView resolveTarget;

    required (GPULoadOp or GPUColor) loadValue;
    required GPUStoreOp storeOp;
};
```

- view `GPUTextureView`，颜色附件要输出到这个纹理上
- resolveTarget `GPUTextureView`，若要进行多次采样，则使用此纹理视图进行接收
- loadValue `GPULoadOp / GPUColor`，若为 GPULoadOp则表示在执行渲染通道的命令前在视图上执行加载操作，否则表示在执行渲染通道的命令前清除视图后填充的颜色值。

#### 15.1.1.2 深度/模板附件

#### 15.1.1.3 加载/存储行为

### 15.1.2 绘制

### 15.1.3 栅格化状态

### 15.1.4 查询

### 15.1.5 Bundles

- executeBundles(bundles)

  当一个 `GPURenderBundle` 执行时，渲染通道的流水线、绑定组、顶点或索引缓存将不会被继承。执行完毕，pipeline、绑定组、顶点和索引缓存将被清空。

# 16 Bundles

# 17 队列

# 18 Queries

# 19 Canvas渲染与交换链

# 20 错误与调试

# 21 类型定义

# 22 要素索引

# 23 附录

