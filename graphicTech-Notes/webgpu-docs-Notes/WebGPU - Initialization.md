参考自 https://www.w3.org/TR/webgpu/#initialization

# 1 `navigator.gpu`

GPU 对象能在浏览器环境（Window环境）获取，也可以在非共享全局 Worker 中获取，其接口定义如下：

``` web-idl
interface mixin NavigatorGPU {
  [SameObject, SecureContext] readonly attribute GPU gpu;
};
Navigator includes NavigatorGPU;
WorkerNavigator includes NavigatorGPU;
```

可以通过访问 `navigator.gpu` 来访问 GPU 对象。

# 2 GPU

> 对应 https://www.w3.org/TR/webgpu/#gpu-interface

`GPU` 是 WebGPU 的入口，可以通过 `navigator.gpu` 访问它。

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPU {
  Promise<GPUAdapter?> requestAdapter(optional GPURequestAdapterOptions options = {});
};
```

## requestAdapter 方法

接收参数为 `GPURequestAdapterOptions` 类型的对象，不可空（即不能为 `{}`），但可选。

GPURequestAdapterOptions 类型见 2.1 小节。

它返回一个 resolve 值为 null 或 `GPUAdapter` 对象的 Promise。

调用这个方法是有讲究的，如果系统发生一些有关显卡的更改，例如拔出了显卡，驱动更新等，适配器将会标记为过时的，在进行请求设备之前，最好再调用一次这个方法。

> 例子：请求一个 GPUAdapter
>
> ``` javascript
> const adapter = await navigator.gpu.requestAdapter(/* ... */);
> const features = adapter.features;
> // ...
> ```

## 2.1 适配器的选择

> 对应 https://www.w3.org/TR/webgpu/#adapter-selection

本小节主要介绍 `GPURequestAdapterOptions` 接口。

在调用 `navigator.gpu.requestAdapter` 方法时，可以传入一个非空的对象来让浏览器选择一个合适的适配器。

``` web-idl
dictionary GPURequestAdapterOptions {
  GPUPowerPreference powerPreference;
  boolean forceFallbackAdapter = false;
};
```

``` web-idl
enum GPUPowerPreference {
  "low-power",
  "high-performance"
};
```

`GPURequestAdapterOptions` 接口有俩成员：

- powerPreference，`GPUPowerPreference` 类型
- forceFallbackAdapter，Boolean 类型，默认为 false

powerPreference，指示浏览器引擎选择哪个适配器，主要针对的是多显卡的操作系统（例如，一张核芯显卡加一张独立显卡）。它只能是这三个值：`undefined`（即什么都不传递）、`"low-power"`、`"high-performance"`。

forceFallbackAdapter，指示是否强制启用回退适配器，回退适配器的定义见 https://www.w3.org/TR/webgpu/#fallback-adapter；一般不用管这个选项。



# 3 GPUAdapter

`GPUAdapter` 封装了一个适配器对象，有两个属性用于描述它的功能和限制。

想获取一个适配器对象，只需调用 `navigator.gpu.requestAdapter()` 方法并 await 它的 resolve 值即可，参考 [方法：requestAdapter](#requestAdapter 方法)。

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUAdapter {
  readonly attribute DOMString name;
  [SameObject] readonly attribute GPUSupportedFeatures features;
  [SameObject] readonly attribute GPUSupportedLimits limits;
  readonly attribute boolean isFallbackAdapter;

  Promise<GPUDevice> requestDevice(optional GPUDeviceDescriptor descriptor = {});
};
```

属性 `name` 是适配器的名称；

属性 `features` 是适配器的功能列表，为只读的  `GPUSupportedFeatures` 类型；

属性 `limits` 是适配器的最大限制，为只读的 `GPUSupportedLimits` 类型；

属性 `isFallbackAdapter` 通常不常用。

## requestDevice 方法

适配器最常用的方法只有一个，`requestDevice`，用来请求一个能访问这个适配器（物理显卡）上现代图形 API 的对象，叫做设备，这是一种封装。它是一个异步方法，返回一个 resolve 值为 GPUDevice 对象的 Promise，你可以用 await 语法来获取设备对象。

这个方法有一个可选的 descriptor 对象参数，但是不能为空对象 `{}`。

想知道这个方法的工作过程，参考文档 [4.4 GPUAdapter](https://www.w3.org/TR/webgpu/#dom-gpuadapter-requestdevice)

## GPUDeviceDescriptor 接口

这个接口是 [requestDevice 方法](#requestDevice 方法) 的可选参数的接口类型，描述适配器如何请求一个设备对象。

``` web-idl
dictionary GPUDeviceDescriptor : GPUObjectDescriptorBase {
  sequence<GPUFeatureName> requiredFeatures = [];
  record<DOMString, GPUSize64> requiredLimits = {};
};

enum GPUFeatureName {
  "depth-clamping",
  "depth24unorm-stencil8",
  "depth32float-stencil8",
  "pipeline-statistics-query",
  "texture-compression-bc",
  "timestamp-query",
};
```

属性 `requiredFeatures` 是一个数组，可选的字符串枚举值是 `GPUFeatureName`，默认是空数组。这个数组告诉适配器对象要请求哪些功能，如果适配器上没有这些功能，请求设备就会失败。

属性 `requiredLimits` 是一个对象，其内部只能是键值对，且值的类型只能是 number（JavaScript 中）。它用于限制所请求的设备。如果适配器不能做出指定的限制，那么请求就会失败。关于限制列表，参考：[WebGPU Spec 3.6.2 Limits](https://www.w3.org/TR/webgpu/#supported-limits)。



# 4 GPUDevice

GPUDevice 封装了一个“设备”，并将此设备的能力通过 API 暴露出来。

<span style="color: blue">**GPUDevice 是 WebGPU 的顶级接口，其他子接口均由它创建。**</span>

想获取一个 `GPUDevice` 实例，调用适配器对象的 `requestDevice()` 方法即可。

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUDevice : EventTarget {
  [SameObject] readonly attribute GPUSupportedFeatures features;
  [SameObject] readonly attribute GPUSupportedLimits limits;

  [SameObject] readonly attribute GPUQueue queue;

  undefined destroy();

  GPUBuffer createBuffer(GPUBufferDescriptor descriptor);
  GPUTexture createTexture(GPUTextureDescriptor descriptor);
  GPUSampler createSampler(optional GPUSamplerDescriptor descriptor = {});
  GPUExternalTexture importExternalTexture(GPUExternalTextureDescriptor descriptor);

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

从上面这段 WebIDL 定义来看，一个 `GPUDevice` 拥有三个属性：

- features：一个 `GPUSupportedFeatures` 对象，描述设备对象有什么特性，关于这个内容请参考 [3.6.2 Limits](https://www.w3.org/TR/webgpu/#limits)
- limits：一个 `GPUSupportedLimits` 对象，描述设备对象的最大限制，例如最多允许有多少个绑定组等信息，关于这个的详细资料请参考 [3.6.2 Limits](https://www.w3.org/TR/webgpu/#limits)
- queue：一个 `GPUQueue` 对象，是此设备对象的主队列。

由于设备对象的能力实在是很多，在此只能简略描述其大致常用用途，具体的方法用途、文档还得到规范文档中对应章节查看。

GPUDevice 对象是可以被序列化和反序列化的，这部分文档有需要的朋友请自行阅读官方文档。



# 5 译者注

适配器 `GPUAdapter` 对接的是物理显卡端，而对不同物理显卡在不同操作系统的现代图形 API（D3D12、Vulkan、Mental）的差异，则由 `GPUDevice` 来封装并提供统一的操作方法，例如创建 `GPUBuffer`、`GPUBindGroup` 等。

这两者的请求操作均为异步编程，不过好在还挺简单，后续 WebGPU 的操作基本上都靠 `GPUDevice` 来操作，所以说设备对象是 WebGPU 中的顶级对象，它的地位与 `WebGLRenderingContext` 类似，但是又不完全一样，以后会写对比文。

考虑到适配器对象会有不可抗因素掉线，例如被拔掉，驱动掉了，所以每次进行某些操作之前，最好确认适配器和设备对象还在，如果不能用，最好再次请求。
