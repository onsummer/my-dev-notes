# 说明

WebGPU 的规范是通过 WebIDL 语言来描述的，本篇主要介绍类型定义。

函数定义、继承描述较为简单，故略去。

用于定义类型的语法有以下五种。



# enum

枚举类型，通常其枚举值就是 JavaScript 字符串，取值时符合里面的任意一个即可。

``` web-idl
enum GPUTextureDimension {
  "1d",
  "2d",
  "3d",
};
```

于是，你可以在创建纹理对象时这样用这个枚举：

``` js
const texture = device.createTexture({
  /* ... */
  dimension: "2d", // <- dimension 字段是 GPUTextureDimension 类型
})
```

你要是传 `"36d"` 那就不合适了。



# namespace

需要通过 `Namespace.XXX` 访问，通常是二进制数字值，也算是一种枚举吧。

``` web-idl
typedef [EnforceRange] unsigned long GPUBufferUsageFlags;
[Exposed=(Window, DedicatedWorker)]
namespace GPUBufferUsage {
  const GPUFlagsConstant MAP_READ      = 0x0001;
  const GPUFlagsConstant MAP_WRITE     = 0x0002;
  const GPUFlagsConstant COPY_SRC      = 0x0004;
  const GPUFlagsConstant COPY_DST      = 0x0008;
  const GPUFlagsConstant INDEX         = 0x0010;
  const GPUFlagsConstant VERTEX        = 0x0020;
  const GPUFlagsConstant UNIFORM       = 0x0040;
  const GPUFlagsConstant STORAGE       = 0x0080;
  const GPUFlagsConstant INDIRECT      = 0x0100;
  const GPUFlagsConstant QUERY_RESOLVE = 0x0200;
};
```

那么创建一个 GPUBuffer 时，它的 `usage` 字段就可以这么设置：

``` js
const buffer = device.createBuffer({
  usage: GPUBufferUsage.UNIFORM,
  /* ... */
})
```

因为字面量是二进制数字值，所以可以用位运算来实现多种类型并设：

``` js
const buffer = device.createBuffer({
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.MAP_WRITE,
  /* ... */
})
```

如果有朋友喜欢背书的，可以把它们的数值熟记于心，然后直接用字面值赋值也不是不可以（但是，真的很蠢）。



# interface

interface 通常有一个对应的 JavaScript Class，大多数是通过设备对象创建而来（通道编码器、适配器等则不是）。

大多数在浏览器 window 环境和专用型 WebWorker 下可以获取到。

大多数需要一个对应的 descriptor，即 JavaScript Object 作为参数。

``` js
const adapter = await navigator.gpu.requestAdapter()
console.log(adapter instanceof GPUAdapter) // true
```

创建行为：

``` typescript
const device = await adapter.requestDevice()

const getBuffer = (desc: GPUBufferDescriptor): GPUBuffer => {
  return device.createBuffer(desc)
}

const buffer = getBuffer({ /* ... */ })
```

虽然上面这两段 typescript 代码有点蠢，但是足够说明 interface 了。



# dictionary

一个 dictionary 代表一个 JavaScript Object。

``` typescript
// typescript

const bufferEntry: GPUBindGroupLayoutEntry = {
  binding: 0,
  visibility: GPUShaderStage.VERTEX,
  buffer: { /* 全部默认，代表 UBO */ }
}
```

有时候表示一种 descriptor，有时候代表 descriptor 中某个字段的值。



# typedef

定义一种数字类型的别名，类似 C 语言中的宏定义。

``` web-idl
typedef [EnforceRange] unsigned long GPUBufferDynamicOffset;
typedef [EnforceRange] unsigned long GPUStencilValue;
typedef [EnforceRange] unsigned long GPUSampleMask;
typedef [EnforceRange] long GPUDepthBias;

typedef [EnforceRange] unsigned long long GPUSize64;
typedef [EnforceRange] unsigned long GPUIntegerCoordinate;
typedef [EnforceRange] unsigned long GPUIndex32;
typedef [EnforceRange] unsigned long GPUSize32;
typedef [EnforceRange] long GPUSignedOffset32;

typedef unsigned long GPUFlagsConstant;
```

主要用到的有这些类型。

| 数字类型           | 解释               |
| ------------------ | ------------------ |
| unsigned long      | UInt32，占 4bytes  |
| unsigned long long | UInt64，占 8bytes  |
| long               | UInt16，占 2bytes  |
| float              | Float32，占 4bytes |
| double             | Float64，占 8bytes |

