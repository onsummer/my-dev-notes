WebGPU 之纹理

# 1 纹理的创建

纹理由 `device.createTexture()` 创建，类型是 `GPUTexture`：

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUTexture {
  GPUTextureView createView(optional GPUTextureViewDescriptor descriptor = {});

  undefined destroy();
};
GPUTexture includes GPUObjectBase;
```

`createTexture` 方法需要一个 `GPUTextureDescriptor` 类型的对象：

``` web-idl
dictionary GPUTextureDescriptor : GPUObjectDescriptorBase {
  required GPUExtent3D size;
  GPUIntegerCoordinate mipLevelCount = 1;
  GPUSize32 sampleCount = 1;
  GPUTextureDimension dimension = "2d";
  required GPUTextureFormat format;
  required GPUTextureUsageFlags usage;
};
```

有三个必选参数：

- `size`: `GPUExtent3D` 类型，表示
  - `GPUExtent3D` 类型
- `format`: `GPUTextureFormat` 类型，即纹理的格式；
  - `GPUTextureFormat` 是一个比较大的部分，见本文中的后面部分介绍 [纹理格式](#3 纹理格式 GPUTextureFormat)
- `usage`: `GPUTextureUsageFlags` 类型，即纹理的用途；
  - `GPUTextureUsage` 是一个枚举类型，有 5 个可选值 `COPY_SRC`、`COPY_DST`、`TEXTURE_BINDING`、`STORAGE_BINDING` 和  `RENDER_ATTACHMENT`，分别代表十六进制值 `0x01`、`0x02`、`0x04`、`0x08` 和 `0x10`：

``` web-idl
typedef [EnforceRange] unsigned long GPUTextureUsageFlags;
[Exposed=(Window, DedicatedWorker)]
namespace GPUTextureUsage {
  const GPUFlagsConstant COPY_SRC          = 0x01;
  const GPUFlagsConstant COPY_DST          = 0x02;
  const GPUFlagsConstant TEXTURE_BINDING   = 0x04;
  const GPUFlagsConstant STORAGE_BINDING   = 0x08;
  const GPUFlagsConstant RENDER_ATTACHMENT = 0x10;
};
```

还有三个可选参数：

- `mipLevelCount`，类型是 unsigned long，默认值是 1，表示 mipmap 的等级数
- `sampleCount`，类型是 unsigned long，默认值是 1，表示采样次数，**只能是 1 或 4**
- `dimension`，类型是 `GPUTextureDimension` 枚举，默认值是 `"2d"`，表示纹理的维度，即默认是二维纹理；

GPUTextureDimension 的定义如下：

``` web-idl
enum GPUTextureDimension {
  "1d",
  "2d",
  "3d",
};
```

> 译者注：mipLevelCount 中所提及的 mipmap，即多级纹理，类似金字塔技术，而 mipLevelCount 即多级纹理的有多少级。

## 举例

例如，创建一个用于多重采样抗锯齿渲染的纹理，其用途是 `GPUTextureUsage.RENDER_ATTACHMENT`（即颜色附件），采样次数为 4 次，分辨率同 canvas 的绘制分辨率（设为 800 × 600），那么：

``` js
const msaaTexture = device.createTexture({
  size: {
    width: 800,
    height: 600,
  },
  sampleCount: 4,
  format: "bgra8unorm",
  usage: GPUTextureUsage.RENDER_ATTACHMENT
})
```

又或者，你要创建一个再普通不过的漫反射贴图纹理，这个漫反射贴图图片大小是 256 × 256：

``` js
const texture = device.createTexture({
  size: [256, 256],
  format: "rgba8unorm",
  usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST
})
```

关于如何将 JavaScript 中读取到。的图片数据传递给纹理对象，请参考本文 [为纹理输入图片/视频数据](#4 为纹理输入图片/视频数据)。

## 创建时参数不合法的情况

接下来要说明创建纹理对象时，参数设置有问题的情况：

- 如果 format 参数用的 `GPUTextureFormat` 在 `device.features` 中没有启用，那么会报错；
- 如果触发了下列逻辑关系，那么会返回一个不可用的 GPUTexture 对象，并产生一个 `GPUValidationError` 错误：
  - 设备对象不可用；
  - size 参数的 width、height、depthOrArrayLayers 属性不是正整数；
  - mipLevelCount 不是正整数；
  - sampleCount 既不是 1 也不是 4；
  - dimension 参数如果是 "1d" 且
    - size 参数的 width 属性大于了设备限制列表中的 `maxTextureDimension1D`
    - size 参数的 height 属性值不是 1
    - size 参数的 depthOrArrayLayers 不是1
    - sampleCount 参数不是1
    - format 被设为一种压缩格式或 深度/模板 类型的格式
  - dimension 参数如果是 "2d" 且
    - size 参数的 width 属性大于了设备限制列表中的 `maxTextureDimension2D`
    - size 参数的 height 属性大于了设备限制列表中的 `maxTextureDimension2D`
    - size 参数的 depthOrArrayLayers 属性大于或等于了设备限制列表中的 `maxTextureArrayLayers`
  - dimension 参数如果是 "3d" 且
    - size 参数的 width 属性大于了设备限制列表中的 `maxTextureDimension3D`
    - size 参数的 height 属性大于了设备限制列表中的 `maxTextureDimension3D`
    - size 参数的 depthOrArrayLayers 属性大于或等于了设备限制列表中的 `maxTextureArrayLayers`
    - sampleCount 参数不是1
    - format 被设为一种压缩格式或 深度/模板 类型的格式
  - size 参数的 width 属性不是 纹素(texel)块的宽的整数倍；
  - size 参数的 height 属性不是 纹素块高的整数倍
  - 如果 sampleCount 参数大于 1 且
    - mipLevelCount 不是 1
    - size.depthOrArrayLayers 不是 1
    - usage 包括了 `STORAGE_BINDING` 类型
    - format 不是可渲染类型（即颜色格式或深度/模板格式）
  - mipLevelCount 大于了最大 mip 等级计数值（**最大 mip 等级计数值取值函数**稍后）
  - usage 不是 `GPUTextureUsage` 的联合类型
  - usage 若包括 RENDER_ATTACHMENT，但是 format 参数不是可渲染类型（即颜色格式或深度/模板格式）
  - usage 包括 STORAGE_ATTACHMENT，但是 format 参数不是纯色格式表中的 `STORAGE_BINDING` 类型的格式（参考 [WebGPU Spec 24.1.1 Plain color formats 纯色格式](https://www.w3.org/TR/webgpu/#plain-color-formats)）

很长，但是不需要完全记忆，仅需在报错的时候来找原因即可。



附 **最大 mip 等级计数值取值函数** 伪代码：

``` 
创建 GPUTexture 的参数：dimension, size;
如果 dimension:
	是 "1d", 令 m = size.width
	是 "2d", 令 m = max(size.width, size.height)
	是 "3d", 令 m = max(max(size.width, size.height), size.depthOrArrayLayers)
	
返回 floor(log_2(m)) + 1
```



# 2 纹理视图 GPUTextureView

截至发文，官方暂时还未对纹理视图对象做出定义，可能借鉴了经典的 Model - View 设计吧。

总之，纹理要通过绑定组对象（GPUBindGroup）传递给着色器，或者要传递给可编程通道编码器（GPUProgramablePassEncoder），必须是传递其纹理视图对象。

创建纹理视图对象其实蛮简单，由纹理对象调用其 `createView()` 方法即可，这个方法的参数对象可以不传递（通常大多数时候是如此）。

来看看这个可选但不可空的创建参数对象的类型 `GPUTextureViewDescriptor`

``` web-idl
dictionary GPUTextureViewDescriptor : GPUObjectDescriptorBase {
  GPUTextureFormat format;
  GPUTextureViewDimension dimension;
  GPUTextureAspect aspect = "all";
  GPUIntegerCoordinate baseMipLevel = 0;
  GPUIntegerCoordinate mipLevelCount;
  GPUIntegerCoordinate baseArrayLayer = 0;
  GPUIntegerCoordinate arrayLayerCount;
};

enum GPUTextureViewDimension {
  "1d",
  "2d",
  "2d-array",
  "cube",
  "cube-array",
  "3d"
};

enum GPUTextureAspect {
  "all",
  "stencil-only",
  "depth-only"
};
```

- 参数 format 即格式，同 GPUTexture；
- 参数 dimension 与 GPUTexture 的 GPUTextureDimension 不大一样，是 `GPUTextureViewDimension` 类型的，多了几个值；
- 参数 aspect 是枚举类型 `GPUTextureAspect` 的，指定这个 GPUTextureView 用到纹理对象的哪些方面；
- 参数 baseMipLevel 为 unsigned long 类型，它指定其 mipmap（多级纹理）的基础等级，默认是 0；
- 参数 mipLevelCount 为 unsigned long 类型，它与 GPUTexture 的 mipLevelCount 意义相同；
- 参数 baseArrayLayer 为 unsigned long 类型，它默认值是 0；
- 参数 arrayLayerCount 为 unsigned long 类型。

## 创建时参数不合法的情况

同样的，对这些参数也有一定的限制。

一旦有符合以下逻辑的，会产生 `GPUValidationError`，并返回一个无效的 `GPUTextureView`：

- 对应的纹理对象失效；
- 如果参数 aspect 是 "stencil-only"：
  - 参数 format 不是 [WebGPU Spec 24.1.2 深度/模板纹理格式类型](https://www.w3.org/TR/webgpu/#depth-formats) 的纹理格式中有模板的那一类
- 如果参数 aspect 是 "depth-only"：
  - 参数 format 不是 [WebGPU Spec 24.1.2 深度/模板纹理格式类型](https://www.w3.org/TR/webgpu/#depth-formats) 的纹理格式中有深度的那一类
- 参数 mipLevelCount 小于等于 0；
- 参数 baseMipLevel + mipLevelCount 的和大于了 mipLevelCount
- 参数 arrayLayerCount 小于等于 0；
- 参数 baseArrayLayer + arrayLayerCount 的和大于了 arrayLayerCoun；
- 参数 format 不是 GPUTextureFormat 类型的；
- 如果参数 dimension 是 "1d"，且 arrayLayerCount 不是 1；
- 如果参数 dimension 是 "2d"，且 arrayLayerCount 不是 1；
- 如果参数 dimension 是 "2d-array"，且纹理对象的 descriptor 的 dimension 不是 "2d"
- 如果参数 dimension 是 "cube"，且
  - arrayLayerCount 不是 6 或
  - 纹理对象的 descriptor.size 的 width 和 height 不一样
  - 纹理对象的 descriptor 的 dimension 不是 "2d"
- 如果参数 dimension 是 "cube-array"，且
  - arrayLayerCount 不是 6 的倍数
  - 纹理对象的 descriptor.size 的 width 和 height 不一样
  - 纹理对象的 descriptor 的 dimension 不是 "2d"
- 如果参数 dimension 是 "3d"，且
  - arrayLayerCount 不是 1
  - 纹理对象的 descriptor 的 dimension 不是 "3d"

## *简述创建过程

这个过程仅作辅助理解资料。

创建一个类型为 `GPUTextureView` 的对象，将它的 [[texture]] 设为调用创建方法的纹理对象；然后将 [[descriptor]] 设为传入创建方法的参数对象；配置其 extent；

若没在创建纹理视图对象的参数中传递 dimension，那么就会继承纹理对象的 dimension；

若没在创建纹理视图对象的参数中传递 arrayLayerCount，那么根据上一步 dimension 的值：

- 若为 "1d"、"2d"、"3d"，则 arrayLayerCount 设为 1
- 若为 "cube"，则 arrayLayerCount 设为 6
- 若为 "2d-array" 或 "cube-array"，则 arrayLayerCount 设为纹理对象的 size.depthOrArrayLayers 减去 baseArrayLayer 的差值；

最后返回此 GPUTextureView 对象。

如果你不好决定 arrayLayerCount，你可以根据 texture 的 dimension 来判断，若为 "1d" 或 "3d"，则为 1，否则为纹理对象 size.depthOrArrayLayers 的值。

# 3 纹理格式 GPUTextureFormat

纹理格式的名称中有一些简写，这些简写决定了纹理各个组件的顺序、比特位数、数据类型。

- `r,g,b,a` 即红绿蓝、阿尔法透明
- `unorm` 即 unsigned normalized（无符号归一化）
- `snorm` 即 signed normalized（有符号归一化）
- `uint` 即 unsigned int（无符号整数）
- `sint` 即 signed int（有符号整数）
- `float` 即 float point（浮点数）

若格式名有 `-srgb` 后缀，则在着色器中读取、写入颜色值是要经过 sRGB 颜色转换的；

压缩纹理格式由 GPU功能列表提供（见适配器部分文档），这种格式使用前缀区分，例如 `etc2-rgba8unorm`。

**纹素块（Texel block）** 是纹理中单个可索引的元素（像素纹理中）或压缩块（压缩纹理中）。

纹素块的宽高决定了一个纹素块的大小。

- 像素纹理的纹素块宽×高永远是 1 × 1
- 压缩纹理中，宽度是指整个纹素块一行的纹素个数，高度是整个纹素块的行数。

**纹素块大小（Texel block size）**指的是一个纹素块的字节大小，除了 `"stencil8"`、`"depth24plus"` 和 `"depth24plus-stencil8"` 之外，每种纹理格式的纹素块大小都是恒定的。

下面列举所有纹理格式：

``` web-idl
enum GPUTextureFormat {
  // 8-bit 纹理格式
  "r8unorm",
  "r8snorm",
  "r8uint",
  "r8sint",

  // 16-bit 纹理格式
  "r16uint",
  "r16sint",
  "r16float",
  "rg8unorm",
  "rg8snorm",
  "rg8uint",
  "rg8sint",

  // 32-bit 纹理格式
  "r32uint",
  "r32sint",
  "r32float",
  "rg16uint",
  "rg16sint",
  "rg16float",
  "rgba8unorm",
  "rgba8unorm-srgb",
  "rgba8snorm",
  "rgba8uint",
  "rgba8sint",
  "bgra8unorm",
  "bgra8unorm-srgb",
  // Packed 32-bit 纹理格式
  "rgb9e5ufloat",
  "rgb10a2unorm",
  "rg11b10ufloat",

  // 64-bit 纹理格式
  "rg32uint",
  "rg32sint",
  "rg32float",
  "rgba16uint",
  "rgba16sint",
  "rgba16float",

  // 128-bit 纹理格式
  "rgba32uint",
  "rgba32sint",
  "rgba32float",

  // 深度和模板纹理格式
  "stencil8",
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",

  // BC 压缩纹理格式：需要在设备上具有 "texture-compression-bc" 功能，并且适配器支持此功能
  "bc1-rgba-unorm",
  "bc1-rgba-unorm-srgb",
  "bc2-rgba-unorm",
  "bc2-rgba-unorm-srgb",
  "bc3-rgba-unorm",
  "bc3-rgba-unorm-srgb",
  "bc4-r-unorm",
  "bc4-r-snorm",
  "bc5-rg-unorm",
  "bc5-rg-snorm",
  "bc6h-rgb-ufloat",
  "bc6h-rgb-float",
  "bc7-rgba-unorm",
  "bc7-rgba-unorm-srgb",

  // 需要在请求设备时启用 "depth24unorm-stencil8" 功能
  "depth24unorm-stencil8",

  // 需要在请求设备时启用 "depth32float-stencil8" 功能
  "depth32float-stencil8",
};
```

其中，`"depth24plus"` 和 `"depth24plus-stencil8"` 格式的深度部分可以用 24位无符号归一化值（`"depth24unorm"`）或 32位 IEEE754 标准浮点数（`"depth32float"`）实现。

`"stencil8"` 格式可以单独实现，也可以在 `"depth24stencil8"` 种屏蔽掉深度部分实现。

**可渲染格式** 包括 **颜色可渲染格式**、**深度模板可渲染格式**，这部分分类可在 [WebGPU Spec 24.1.1 Plain color formats | 纯色格式](https://www.w3.org/TR/webgpu/#plain-color-formats) 列表中的 "RENDER_ATTACHMENT" 类别中找到。



# 4 为纹理输入图片/视频数据

## 使用 GPUQueue.copyExternalImageToTexture 方法

从外部（也就是 HTMLCanvasElement、HTMLVideoElement、ImageBitmap）中传数据到 `GPUTexture`，可以使用 `GPUQueue.copyExternalImageToTexture` 这个方法，这里使用 ImageBitmap 作示例：

``` typescript
// typescript

let texture: GPUTexture;
// 使用代码块分割作用域；
{
	// 请求图像并异步解码为 ImageBitmap
  const img = document.createElement('img');
  img.src = `http://path/to/your/image.png`;
  await img.decode();
  const imageBitmap = await createImageBitmap(img);

  // 创建纹理对象
  texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | 
    	GPUTextureUsage.COPY_DST | 
    	GPUTextureUsage.RENDER_ATTACHMENT,
  });
  
  // 立即让队列执行一个 “拷贝外部图像数据到纹理” 的操作
  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: cubeTexture },
    [imageBitmap.width, imageBitmap.height]
  );
}
```

参考 

[WebGPU Spec 12.3.5 GPUImageCopyExternalImage](https://www.w3.org/TR/webgpu/#gpu-image-copy-external-image)

[WebGPU Spec 17 Queue copyExternalImageToTexture](https://www.w3.org/TR/webgpu/#dom-gpuqueue-copyexternalimagetotexture)

``` web-idl
dictionary GPUImageCopyExternalImage {
  required (ImageBitmap or HTMLCanvasElement or OffscreenCanvas) source;
  GPUOrigin2D origin = {};
};
```

## 使用 GPUQueue.writeTexture 方法

这个方法与 GPUQueue.copyExternalImageToTexture 方法略有不同，请读者自行思考二者异同。

---

## 使用 GPUDevice.importExternalTexture 方法

关于视频数据的传递，则需要使用 `device.importExternalTexture` 这个方法，详细请参考：

[WebGPU Spec 4.5 GPUDevice importExternalTexture](https://www.w3.org/TR/webgpu/#gpudevice)

[WebGPU Spec 6.4.1 Import External Textures](https://www.w3.org/TR/webgpu/#external-texture-creation) 

## 译者注

在使用上述导入数据到纹理的方法时，需要格外注意纹理的 usage，在这些方法的文档中应该都有详尽的说明。譬如，`GPUQueue.copyExternalImageToTexture` 这个方法，就指明了纹理的用途必须是 `RENDER_ATTACHMENT` 与 `COPY_DST` 的合并：

``` js
const texture = device.createTexture({
	/* ... */,
	usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST
})
```



# 3 类比 WebGLFramebuffer 离屏渲染的容器

WebGL 绘制的目标是通过 `gl.bindFramebuffer()` 实现的，通常可以为 WebGLFramebuffer（也就是所谓的 FBO）使用 `gl.framebufferTexture2D()` 设一个 WebGLTexture 对象作为其颜色附件，来进行离屏渲染，否则就默认绘制到 Canvas 这个“纹理”上。

WebGPU 就没有 FBO 这个类了，但是一次绘制指令作用的容器这个概念还是有的，在 WebGPU 中管理着颜色附件、深度模板附件的类，叫做 `GPURenderPassEncoder`，到之后讲到 GPURenderPassEncoder, 渲染通道编码器的时候便会一目了然，在这里提一嘴。

