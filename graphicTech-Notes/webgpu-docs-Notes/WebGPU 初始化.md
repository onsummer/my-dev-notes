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

`GPU` 是 WebGPU 的入口。

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPU {
  Promise<GPUAdapter?> requestAdapter(optional GPURequestAdapterOptions options = {});
};
```



## 2.1 适配器的选择



# 3 GPUAdapter



# 4 GPUDevice

