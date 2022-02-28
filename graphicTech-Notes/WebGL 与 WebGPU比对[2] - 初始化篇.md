# 1. 获取高频操作对象

## 1.1 WebGL 获取上下文对象

WebGL 获取的是 `WebGLRenderingContext/WebGL2RenderingContext` 对象，必须依赖于有合适宽度和高度的 `HTMLCanvasElement`，通常命名为 `gl`，gl 变量有非常多方法，允许修改 WebGL 的全局状态

``` js
const gl = document.getElementById("id")?.getContext("webgl")

// ...
```

## 1.2 WebGPU 获取设备对象

而 WebGPU 则不依赖具体的 Canvas，它操作的是物理图形卡设备，并使用 `ES6/7` 的异步语法获取，获取的是 `GPUAdapter` 和 `GPUDevice`，但是与 `WebGLRenderingContext` 起着类似“发出大多数命令”的大管家式角色的，更多是 `GPUDevice` 对象

```js
const entryFn = async () => {
  if (!navigator.gpu) {
    return
  }
  // 测试版 Chrome 有可能返回 null
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    return
  }
	const device = await adapter.requestDevice()
  // ...
}

entryFn()
```

WebGPU 的入口是 `navigator.gpu` 对象，这个对象在 WebWorker 中也有，所以对 CPU 端的多线程有良好的支持。使用此对象异步请求适配器后，再使用适配器请求具象化的设备对象即可。

至于“适配器”和“设备”的概念界定，需要读者自行阅读 WebGPU Explainer、WebGPU Specification Core Object 等资料，前者大概是物理设备的一个变量符号，而根据不同的场景、线程需求再次请求“设备”，此设备并非物理设备，只是一个满足代码上下文所需要条件的、更实际的“对象”。

> 每次请求的适配器对象是不同的，不具备单例特征。

设备对象用于创建 WebGPU 中几乎所有的子类型，包括 `GPUBuffer`、`GPUTexture` 等，以及访问一些自有属性，例如队列属性 `device.queue`.



# 2. 初始化参数的异同

## 2.1 WebGL

在 WebGLRenderingContext 时，允许传递一些参数：

``` js
const gl = canvasEle.getContext("webgl", {
  alpha: false, // 是否包含透明度缓存区
  antialias: false, // 是否开抗锯齿
  depth: false, // 是否包含一个16位的深度缓冲区
  stencil: false, // 是否包含一个8位的模板缓冲区
  failIfMajorPerformanceCaveat: false, // 在系统性能低的环境中是否创建上下文
  powerPreference: "high-performance", // GPU电源配置，"high-performance" 是高性能
  preserveDrawingBuffer: false, // 是否保留缓冲区
  premultipliedAlpha: false, // 是否预乘透明度通道
})
```

## 2.2 WebGPU 分两步

### 2.2.1 GPUAdapter

在请求 WebGPU 的适配器时，保留了性能选项（当前规范）powerPreference：

``` js
// in async function
const adapter = await navigator.gpu.requestAdapter({
  powerPreference: "high-performance",
})
```

关于 requestAdapter 方法的参数，其类型 `GPURequestAdapterOptions` 定义，见下：

```web-idl
dictionary GPURequestAdapterOptions {
  GPUPowerPreference powerPreference;
  boolean forceFallbackAdapter = false;
};

enum GPUPowerPreference {
  "low-power",
  "high-performance",
};
```

`forceFallbackAdapter` 参数用得不多，有需要的读者可自行查询官方文档。



### 2.2.2 GPUDevice

请求设备对象时，则允许传入 `GPUDeviceDescriptor` 参数对象，该对象允许有两个可选参数，一个是 `requiredFeatures`，类型为 `string[]`，另一个是 `requiredLimits`，类型是键为 string 值为 number 的对象：

``` web-idl
dictionary GPUDeviceDescriptor : GPUObjectDescriptorBase {
  sequence<GPUFeatureName> requiredFeatures = [];
  record<DOMString, GPUSize64> requiredLimits = {};
};
```

requireFeatures 数组的元素是字符串，不是随便填的，要参考 [WebGPU Spec 24 功能索引表](https://www.w3.org/TR/webgpu/#feature-index) 中的功能。传递这个功能数组，就意味着要向适配器请求有这么多功能的设备对象；

requireLimits 则向图形处理器请求判断，我传递进来的这个要求，你能不能满足。

如果超过了适配器的 limits，那么请求将失败，适配器的 requestDevice 方法将返回一个 reject 的 Promise；

如果传入的限制条目的要求没有比全局默认值更好（有“更大更好”和“更小更好”，参考 WebGPU 第3章 中有关 limits 的表述），那就返回带默认值的设备对象，并 resolve Promise；

其中，限制条目有哪些，默认值是多少，对某个限制条目“更大值更好”还是“更小值更好”，要参考 [WebGPU Spec 3.6 限制](https://www.w3.org/TR/webgpu/#limit) 中的表格。

上面这么说会比较抽象，下面举例说明。

例如下面这个例子，请求设备对象时，会问适配器能不能满足我要求的条件：

- 最多要有 2 个绑定组（默认是4个，越大越好，显然 2 < 4）
- 最多只能有 4 个 UBO（默认12个，越大越好，显然 4 < 12）
- 能不能满足 2048 像素尺寸的 2D 纹理（默认 8192 像素，越大越好，显然 2048 < 8192）

``` js
const device = await adapter.requestDevice({
  maxBindGroups: 2,
  maxUniformBuffersPerShaderStage: 4,
  maxTextureDimension2D: 2048,
})
```

显然，请求的这三个条件都满足要求，返回的设备对象的限制列表都按所有限制条目的默认值来。

``` javascript
console.log(device.limits)

{
  maxBindGroup: 4,
  maxUniformBuffersPerShaderStage: 12,
  maxTextureDimension2D: 8192,
  // ...
}
```

> 关于这段，requiredLimits 的含义是“我的程序可能要这样的要求，你这个适配器能不能满足”，而不是“我要这么多要求，你给我返回一个这些参数的设备对象”。设备的创建过程，在 WebGPU Specification 的第 3 章，核心对象 - 设备中有详细描述。



# 3. 总结

WebGL 的请求参数包括了性能参数和功能参数，较为简单。

WebGPU 分成了两个阶段，请求适配器时可以对性能作要求，请求设备对象时可以对使用 GPU 时各个方面的参数作校验能不能满足程序要求。