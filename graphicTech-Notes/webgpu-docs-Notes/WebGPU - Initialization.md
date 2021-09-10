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



# 4 GPUDevice

