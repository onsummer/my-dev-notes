WebGPU 基本概念节选翻译

# 1 公共约定

节选自 [3.1 Conventions](https://www.w3.org/TR/webgpu/#api-conventions)

## ① WebGPU 接口

WebGPU 接口是内部对象的公开访问形式，和大多数语言的接口语法提供的功能差不多。

这里只需注意，继承了 `GPUObjectBase` 的接口都是 WebGPU 接口。

``` web-idl
interface mixin GPUObjectBase {
  attribute USVString? label;
};
```

label 字段用来描述对象自身，可空。

## ② 对象描述者

对象描述者包含创建一个对象所需的信息，通常调用 `GPUDevice` 的 `createXXX` 方法完成。

``` web-idl
dictionary GPUObjectDescriptorBase {
  USVString label;
};
```

此处的 label 和 GPUObjectBase 的 label 含义差不多。

# 2 坐标系统

节选自 [3.3 Coordinate Systems](https://www.w3.org/TR/webgpu/#coordinate-systems)

- 在 NDC 中，Y轴朝上。NDC的点 `(-1.0, -1.0)` 位于 NDC 的左下角。NDC的 X 和 Y 的最大最小值为 1 和 -1，Z 的取值范围是 `[0, 1]`。NDC 中超出此范围的点会被剪裁。
- 在 Framebuffer、视口坐标系和 Fragment/像素坐标系中 Y轴朝下。原点 `(0, 0)` 位于这几个坐标系的左上角。
- 视窗坐标和帧缓存（Framebuffer）坐标相匹配。
- 纹理坐标的原点 `(0, 0)` 表示纹理数据的第一个纹素（texel）。

WebGPU 的坐标系和 DirectX 坐标系匹配。



# 3 核心对象

节选自 [3.5 Core Internal Objects](https://www.w3.org/TR/webgpu/#core-internal-objects)

## Adapter（适配器）

适配器对象表示 WebGPU 在具体系统中现代图形接口的实现。如果适配器对象变得不可用了，那就会被标记为无效，并且永远不会再变有效，并且，连带着由它创建的设备等对象一并变得无效。

适配器对象可以简单理解为图形处理器，既可以是真的物理显卡，也可以是由模拟出来的的软显卡。不同的适配器对象允许指向同一个显卡，譬如适配器A和适配器B，只是在请求参数上略有不同。

适配器对象在 WebGPU 中由 `GPUAdapter` 接口实现。

关于适配器对象的请求与创建过程，参考初始化部分的内容。

## Devices（设备）

设备是适配器的逻辑功能上的实现，所有的 WebGPU 子对象均由设备对象创建，它可以在专用型 WebWorker 中使用。

如果设备对象失效了，那么由设备对象创建的子对象也会变得不可用。

设备对象在 WebGPU 中由 `GPUDevice` 接口实现。

关于设备对象的请求与创建过程，参考初始化部分的内容。



# 4 WebGPU 的功能列表及其最大限制

节选自 [3.6 Optional Capabilities](https://www.w3.org/TR/webgpu/#optional-capabilities)

## 4.2 功能

功能，指的是一组可选的 WebGPU 功能，并不是所有的平台都支持，通常是操作系统或者显卡硬件不支持。

每个 GPUAdapter 都会带有一个 `features` 对象，在请求设备对象时只能用这个对象内的功能，也只有在请求设备对象时，才能设置这个即将被创建的设备对象能有哪些功能。

有关 WebGPU 功能的具体描述，参考 [WebGPU Spec 23. Feature Index](https://www.w3.org/TR/webgpu/#feature-index) 后列举如下：

> 译者注
>
> 有点蛋疼的是，你直接访问 `adapter.features` 它只是个类似 Set 的对象，而不是普通的对象能看到里面有什么支持的功能，要你自己去访问 values ...

### ① depth-clamping

启用这个功能时，`GPUPrimitiveState` 接口的 `clampDepth` 属性才能被设置：

``` js
const renderPipeline = device.createRenderPipeline({
  /*...*/,
  primitive: {
    /* ... */,
    clampDepth: true
  }
})
```

### ② depth24unorm-stencil8

启用这个功能时，才能创建 "depth24unorm-stencil8" 格式的纹理对象：

``` js
const texture = device.createTexture({
  /* ... */,
  format: "depth24unorm-stencil8"
})
```

### ③ depth32float-stencil8

启用这个功能时，才能创建 "depth32float-stencil8" 格式的纹理对象：

``` js
const texture = device.createTexture({
  /* ... */,
  format: "depth32float-stencil8"
})
```

### ④ pipeline-statistics-query

启用这个功能时，枚举类型 `GPUQueryType` 才能用。

### ⑤ texture-compression-bc

启用这个功能时，才能创建 BC 格式的纹理：

``` js
const texture = device.createTexture({
  /* ... */,
  format: "bc1-rgba-unorm" / "bc1-rgba-unorm-srgb" / "bc2-rgba-unorm" / "bc2-rgba-unorm-srgb" / "bc3-rgba-unorm" / "bc3-rgba-unorm-srgb" / "bc4-r-unorm" / "bc4-r-snorm" / "bc5-rg-unorm" / "bc5-rg-snorm" / "bc6h-rgb-ufloat" / "bc6h-rgb-float" / "bc7-rgba-unorm" / "bc7-rgba-unorm-srgb"
})
```

### ⑥ timestamp-query

启用这个功能后，枚举类型 `GPUQueryType` 中的 `"timestamp"` 枚举才能使用。



## 4.1 限制

每个限制属性的值类型都是数字。每个限制对象（适配器对象和设备对象的一个属性）上的限制属性个数都是一样的，区别就是他们的值有可能不太一样。

设备对象的限制优先级高于适配器的，因为大多时候用的是设备对象，而且设备对象是由适配器对象请求的，适配器对象请求设备对象的时候可以传递对设备对象的限制需求。

注意，每条限制要与硬件适配，不要在移动设备上把限制放得很宽，否则容易影响性能。合理的限制需要因具体硬件而定。

每条限制都有一个默认值，如果适配器在请求设备时，没有传递限制参数 `requiredLimits`，那么就会使用默认值。

现在，对限制值进行逐条解释。

| 限制名                                    | 类型              | 建议值   | 默认值          | 解释                                                         |
| ----------------------------------------- | ----------------- | -------- | --------------- | ------------------------------------------------------------ |
| maxTextureDimension1D                     | unsigned long     | 可设更高 | 8192            | 创建一维纹理对象时，`size` 属性最大允许值                    |
| maxTextureDimension2D                     | unsigned long     | 可设更高 | 8192            | 创建二维纹理对象时，`size` 属性最大允许值                    |
| maxTextureDimension3D                     | unsigned long     | 可设更高 | 8192            | 创建三维纹理对象时，`size` 属性最大允许值                    |
| maxTextureArrayLayers                     | unsigned long     | 可设更高 | 256             | `GPUExtent3DDict` 对象的 `depthOrArrayLayers` 属性的最大值   |
| maxBindGroups                             | unsigned long     | 可设更高 | 4               | 创建 `GPUPipelineLayout` 时，绑定组的布局对象数量（也即绑定组的最大个数） |
| maxDynamicUniformBuffersPerPipelineLayout | unsigned long     | 可设更高 | 8               | 创建 `GPUPipelineLayout` 时，每个管线的布局对象中允许设置带有动态偏移值的 UBO 的最大数量 |
| maxDynamicStorageBuffersPerPipelineLayout | unsigned long     | 可设更高 | 4               | 创建 `GPUPipelineLayout` 时，每个管线的布局对象中允许设置带有动态偏移值的存储型 GPUBuffer 的最大数量 |
| maxSampledTexturesPerShaderStage          | unsigned long     | 可设更高 | 16              | （在其可能用到的着色器阶段中）绑定组的布局对象中允许设置采样纹理的最大个数 |
| maxStorageBuffersPerShaderStage           | unsigned long     | 可设更高 | 8               | （在其可能用到的着色器阶段中）绑定组的布局对象中允许设置的存储型 GPUBuffer 的最大个数 |
| maxStorageTexturesPerShaderStage          | unsigned long     | 可设更高 | 4               | （在其可能用到的着色器阶段中）绑定组的布局对象中允许设置的存储型纹理的最大个数 |
| maxUniformBuffersPerShaderStage           | unsigned long     | 可设更高 | 12              | （在其可能用到的着色器阶段中）绑定组的布局对象中允许设置的 UBO 的最大个数 |
| maxUniformBufferBindingSize               | unsigned longlong | 可设更高 | 16384           | 绑定组布局对象的 entry 中 UBO 的 `size` 属性的最大值         |
| maxStorageBufferBindingSize               | unsigned longlong | 可设更高 | 13427728(128MB) | 绑定组布局对象的 entry 中存储型或只读存储型 (`storage` 或 `read-only-storage`)  GPUBuffer 的 `size` 属性的最大值 |
| minUniformBufferOffsetAlignment           | unsigned long     | 尽量设小 | 256             | 绑定组布局对象的 entry 中 UBO 的 offset 值，以及 `setBindGroup` 方法的动态 offset 值，这是一个对齐值 |
| minStorageBufferOffsetAlignment           | unsigned long     | 尽量设小 | 256             | 绑定组布局对象的 entry 中存储型或只读存储型 (`storage` 或 `read-only-storage`)  GPUBuffer 的 offset 值，以及 `setBindGroup` 方法的动态 offset 值，这是一个对齐值 |
| maxVertexBuffers                          | unsigned long     | 可设更高 | 8               | 渲染管线能创建最大 VBO 的个数                                |
| maxVertexAttributes                       | unsigned long     | 可设更高 | 16              | 渲染管线中 VBO 的最大顶点属性个数                            |
| maxVertexBufferArrayStride                | unsigned long     | 可设更高 | 2048            | 渲染管线中 VBO 的最大字节偏移量                              |
| maxInterStageShaderComponents             | unsigned long     | 可设更高 | 60              | 不同渲染阶段通信时，在通信中传递的变量中允许的最大组件个数（例如顶点阶段到片元阶段） |
| maxComputeWorkgroupStorageSize            | unsigned long     | 可设更高 | 16352           | 计算着色器入口函数中工作组允许使用的最大空间（单位：字节）   |
| maxComputeInvocationsPerWorkgroup         | unsigned long     | 可设更高 | 256             | 计算着色器入口函数中 workgroup_size 乘积的最大值             |
| maxComputeWorkgroupSizeX                  | unsigned long     | 可设更高 | 256             | 计算着色器入口函数中 workgroup_size 中 X 维度的最大值        |
| maxComputeWorkgroupSizeY                  | unsigned long     | 可设更高 | 256             | 计算着色器入口函数中 workgroup_size 中 Y 维度的最大值        |
| maxComputeWorkgroupSizeZ                  | unsigned long     | 可设更高 | 64              | 计算着色器入口函数中 workgroup_size 中 Z 维度的最大值        |
| maxComputeWorkgroupsPerDimension          | unsigned long     | 可设更高 | 65535           | 计算通道编码器的 `dispatch(x, y, z)` 函数参数中的最大值      |



### 4.1.1 GPUSupportedLimits

`GPUSupportedLimits` 接口暴露了适配器或者设备对象的最大限制，直接访问 `device.limits` 或 `adapter.limits` 即可，是一个对象。

``` web-idl
[Exposed=(Window, DedicatedWorker)]
interface GPUSupportedLimits {
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
  readonly attribute unsigned long long maxUniformBufferBindingSize;
  readonly attribute unsigned long long maxStorageBufferBindingSize;
  readonly attribute unsigned long minUniformBufferOffsetAlignment;
  readonly attribute unsigned long minStorageBufferOffsetAlignment;
  readonly attribute unsigned long maxVertexBuffers;
  readonly attribute unsigned long maxVertexAttributes;
  readonly attribute unsigned long maxVertexBufferArrayStride;
  readonly attribute unsigned long maxInterStageShaderComponents;
  readonly attribute unsigned long maxComputeWorkgroupStorageSize;
  readonly attribute unsigned long maxComputeInvocationsPerWorkgroup;
  readonly attribute unsigned long maxComputeWorkgroupSizeX;
  readonly attribute unsigned long maxComputeWorkgroupSizeY;
  readonly attribute unsigned long maxComputeWorkgroupSizeZ;
  readonly attribute unsigned long maxComputeWorkgroupsPerDimension;
};
```

每项的解释见上文。

### 4.1.2 GPUSupportedFeatures

`GPUSupportedFeatures` 即 `device.features` 和 `adapter.features` 对象所实现的接口。

这个对象不是普通的 JavaScript 对象，而是类似 ES6 中 `Set` 一样的集合，你可以使用 `has` 方法来查看有什么功能。它只能添加 `GPUFeatureName` （定义在 [4.4.1.1 GPUFeatureName](https://www.w3.org/TR/webgpu/#enumdef-gpufeaturename)）枚举中的值。

``` web-idl
[Exposed=(Window, DedicatedWorker)]
interface GPUSupportedFeatures {
    readonly setlike<DOMString>;
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

注意，`GPUFeatureName` 会慢慢添加，但是浏览器实现不一定就跟得上进度，这时候可以用判断优雅地解决：

``` js
if (adapter.features.has('unknown-feature')) {
  // Use unknown-feature
} else {
  console.warn('unknown-feature is not supported by this adapter.');
}
```





