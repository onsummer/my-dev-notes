# GPUSampler：采样器

`GPUSampler` 采样器对象，对着色器中的纹理资源进行过滤或者编码。

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUSampler {
};
GPUSampler includes GPUObjectBase;
```

# 采样器的创建

通过 `device.createSampler()` 方法即可创建，这个方法一样需要一个对应类型为 `GPUSamplerDescriptor` 的参数对象。

``` web-idl
dictionary GPUSamplerDescriptor : GPUObjectDescriptorBase {
  GPUAddressMode addressModeU = "clamp-to-edge";
  GPUAddressMode addressModeV = "clamp-to-edge";
  GPUAddressMode addressModeW = "clamp-to-edge";
  GPUFilterMode magFilter = "nearest";
  GPUFilterMode minFilter = "nearest";
  GPUFilterMode mipmapFilter = "nearest";
  float lodMinClamp = 0;
  float lodMaxClamp = 32;
  GPUCompareFunction compare;
  [Clamp] unsigned short maxAnisotropy = 1;
};
```

