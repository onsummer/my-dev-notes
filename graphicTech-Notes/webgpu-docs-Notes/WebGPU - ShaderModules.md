对应文档中的 https://www.w3.org/TR/webgpu/#shader-modules

# GPUShaderModule 接口

这个接口是可以序列化的，意味着可以传递其引用进行多线程编程。

它是不可变对象（只读），所以不存在冲突的问题。

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUShaderModule {
	Promise<GPUCompilationInfo> compilationInfo();
};
GPUShaderModule includes GPUObjectBase;
```



## 创建

创建一个 GPUShaderModule，需要调用 `device.createShaderModule` 方法。

此方法接受一个 `GPUShaderModuleDescriptor` 接口类型的对象，它不能为空对象，也不能不传递。

``` web-idl
dictionary GPUShaderModuleDescriptor : GPUObjectDescriptorBase {
  required USVString code;
  object sourceMap;
};
```

如果传递了 `sourceMap`，即可使用一些工具来调试。这个是可选的。

例子：

``` js
const vsModule = device.createShaderModule({
  code: `
  [[location(0)]] var<out> outColor: vec4<f32>;

  [[stage(fragment)]]
  fn main() -> void {
    outColor = vec4<f32>(1.0, 0.2, 0.4, 1.0);
    return;
  }
	`,
})
```





## 编译信息



