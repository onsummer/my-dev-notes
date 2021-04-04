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

## 3.4 编程模型

## 3.5 核心内部对象

## 3.6 可选功能

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

## 8.2 GPUBindGroup

## 8.3 GPUPipeLineLayout

# 9 着色器模块

## 9.1 GPUShaderModule

# 10 流水线

## 10.1 基本流水线

## 10.2 GPUComputePipeline

## 10.3 GPURenderPipeline

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

# 16 Bundles

# 17 队列

# 18 Queries

# 19 Canvas渲染与交换链

# 20 错误与调试

# 21 类型定义

# 22 要素索引

# 23 附录

