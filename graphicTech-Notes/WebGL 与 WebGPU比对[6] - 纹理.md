图形编程中的纹理，是一个很大的话题，涉及到的知识面非常多，有硬件的，也有软件的，有实时渲染技术，也有标准的实现等非常多可以讨论的。

受制于个人学识浅薄，本文只能浅表性地列举 WebGL 和 WebGPU 中它们创建、数据传递和着色器中大致的用法，格式差异，顺便捞一捞压缩纹理的资料。

# 1. WebGL 中的纹理

## 1.1. 创建二维纹理与设置采样参数

创建纹理对象 `texture`，并将其绑定：

``` js
const texture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, texture)
```

此时这个对象只是一个空的 `WebGLTexture`，还没有发生数据传递。

WebGL 没有采样器 API，纹理采样参数的设置是通过调用 `gl.texParameteri()` 方法完成的：

``` js
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
```

采样参数是 `gl.TEXTURE_WRAP_S`、`gl.TEXTURE_WRAP_T`、`gl.TEXTURE_MIN_FILTER`、`gl.TEXTURE_MAG_FILTER`，这四个采样参数的值分别是 `gl.CLAMP_TO_EDGE`、`gl.CLAMP_TO_EDGE`、`gl.NEAREST`、`gl.NEAREST`，具体含义就不细说了，我认为这方面的资料还是蛮多的。



## 1.2. 纹理数据写入与拷贝

**首先，是纹理数据的写入。**

使用 `gl.texImage2D()` 方法将内存中的数据写入至纹理中，流向是 `CPU → GPU`：

``` js
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
```

这个函数有非常多种重载，可以自行查阅 MDN 或 WebGL 有关规范。

上述函数调用传递的 `image` 是 `Image` 类型的，也即 `HTMLImageElement`；其它的重载可以使用的数据来源还可以是：

- `ArrayBufferView`：`Uint8Array`、`Uint16Array`、`Uint32Array`、`Float32Array`
- `ImageData`
- `HTMLImageElement`/`HTMLCanvasElement`/`HTMLVideoElement`
- `ImageBitmap`

不同数据来源有对应的数据写入方法。

**其次，是纹理的拷贝。**

WebGL 2.0 使用 `gl.blitFramebuffer()` 方法，以帧缓冲对象为媒介，拷贝附着在两类附件上的关联纹理对象。

下面为拷贝 renderableFramebuffer 的颜色附件的简单示例代码：

``` js
const renderableFramebuffer = gl.createFramebuffer();
const colorFramebuffer = gl.createFramebuffer();

// ... 一系列绑定和设置 ...

gl.bindFramebuffer(gl.READ_FRAMEBUFFER, renderableFramebuffer);
gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, colorFramebuffer);

// ... 执行绘制 ...

gl.blitFramebuffer(    
  0, 0, FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y,    
  0, 0, FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y,    
  gl.COLOR_BUFFER_BIT, gl.NEAREST
);
```

WebGL 2.0 允许将 FBO 额外绑定到可读帧缓冲（`gl.READ_FRAMEBUFFER`）或绘制帧缓冲（`gl.DRAW_FRAMEBUFFER`），WebGL 1.0 只能绑定至单个帧缓冲 `gl.FRAMEBUFFER`.

WebGL 1.0 没那么便利，就只能自己封装比较麻烦一点的做法了，提供如下思路：

- 把目标纹理附着到一个 FBO 上，利用一个 `WebGLProgram` 把源纹理通过着色器渲染进 FBO
- 把源纹理附着到一个 FBO 上，利用 `gl.copyTexImage2D()` 或 `gl.copyTexSubImage2D()` 方法拷贝到目标纹理
- 把源纹理附着到一个 FBO 上或直接绘制到 canvas 上，使用 `gl.readPixels()` 读取渲染结果，然后使用 `gl.texImage2D()` 将像素数据写入目标纹理（这个方法看起来很蠢，虽然技术上行得通）



## 1.3. 着色器中的纹理

如何在片元着色器代码中对纹理进行采样，获取该顶点对应的纹理颜色呢？

很简单，获取顶点着色器发送过来的插值后的片元纹理坐标 `v_texCoord`，然后对纹理对象进行采样即可。

``` glsl
uniform sampler2D u_textureSampler;
varying vec2 v_texCoord;

void main() {
  gl_FragColor = texture2D(u_textureSampler, v_texCoord);
}
```

关于如何通过 uniform 传递纹理到着色器中，还请查阅我之前发过的 Uniform 一文。



## 1.4. 纹理对象 vs 渲染缓冲对象

很多国内外的文章有介绍这两个东西，它们通常出现在离屏渲染容器 - 帧缓冲对象的关联附件上。

感兴趣 FBO / RBO 主题的可以翻翻我不久之前的文章。

纹理与渲染缓冲，即 `WebGLTexture` 和 `WebGLRenderbuffer`，其实最大的区别就是纹理允许再次通过 uniform 的形式传给下一个渲染通道的着色器，进行纹理采样。有资料说这两个是存在性能差异的，但是我认为那点差异还不如认真设计好架构。

- 如果你使用 MRT（无论是通过扩展还是直接使用 WebGL 2.0）技术，建议优先选择渲染缓冲对象，但是其实用哪个都无所谓；
- 如果你要使用 WebGL 2.0 的 MSAA，那你得用渲染缓冲；
- 如果你要把 draw 的结果再次传递给下一个渲染通道，那么你得用纹理对象；
- 对于读像素，用哪个都无所谓，看你用的是 WebGL 1.0 还是 WebGL 2.0，都有对应的方法。



## 1.5. 立方体六面纹理

这东西虽然是给立方体的六个面贴图用的“特殊”纹理，但是非常合适做环境贴图，对应的数据传递函数、着色器采样函数都略有不同。

``` js
// 注意第一个参数，既然有 6 面，就有六个值，这里是 X 轴正方向的面
gl.texImage2D(
  gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
  0, 
  gl.RGBA, 
  gl.RGBA, 
  gl.UNSIGNED_BYTE, 
  imagePositiveX)

// 为立方体纹理创建 Mipmap
gl.generateMipmap(gl.TEXTURE_CUBE_MAP)

// 设置采样参数
gl.texParameteri(
  gl.TEXTURE_CUBE_MAP, 
  gl.TEXTURE_MIN_FILTER, 
  gl.LINEAR_MIPMAP_LINEAR)
```

在着色器中：

``` glsl
// 顶点着色器
attribute vec4 a_position;
uniform mat4 u_vpMatrix;
varying vec3 v_normal;

void main() {
  gl_Position = u_vpMatrix * a_position;
  // 因为位置是以几何中心为原点的,可以用顶点坐标作为法向量
  v_normal = normalize(a_position.xyz);
}

// 片元着色器
precision mediump float; // 从顶点着色器传入
varying vec3 v_normal; // 纹理
uniform samplerCube u_texture; 

void main() {   
  gl_FragColor = textureCube(u_texture, normalize(v_normal));
}
```

这方面资料其实也不少，网上搜索可以轻易找到。



## 1.6. WebGL 2.0 的变化

WebGL 2.0 增加了若干内容，资料可以在 WebGL2Fundamentals 找到，这里简单列举。

- 在着色器中使用 `textureSize()` 函数获取纹理大小
- 在着色器中使用 `texelFetch()` 直接获取指定坐标的纹素
- 支持了更多纹理格式
- 支持了 3D 纹理（而不是立方体六面纹理）
- 支持纹理数组（每个元素都是一个单独的纹理）
- 支持长宽大小是非 2 次幂的纹理
- 支持若干压缩纹理格式
- 支持深度纹理（WebGL 1.0 要调用扩展才能用）
- 加入 `WebGLSampler` 对象的支持
- ...

除此之外，GLSL 升级到 300 后，原来的 `texture2D()` 和 `textureCube()` 纹理采样函数全部改为了 `texture()` 函数，详见文末参考资料的迁移文章。



## 1.7. Mipmapping 技术

裁剪空间里的顶点构成的形状，其实是近大远小的，这点没什么问题。对于远处的物体，透视投影变换完成后会比较小，这就没必要对这个“小”的部分使用“大”的部分一样清晰的纹理了。

Mipmap 能解决这个问题，幸运的是，WebGL 只需简单的方法调用就可以创建 Mipmap，无需操心太多。

``` js
gl.generateMipmap(gl.TEXTURE_2D)
```

在参考资料中，你可以在 《WebGL纹理详解之三：纹理尺寸与Mipmapping》一文中见到不错的解释，还可以看到 `gl.texImage2D()` 的第二个参数 `level` 的具体用法。



# 2. WebGPU 中的纹理

WebGPU 将纹理分成 `GPUTexture` 与 `GPUTextureView` 两种对象。

## 2.1. GPUTexture 的创建

调用 `device.createTexture()` 即可创建一个纹理对象，你可以通过传参指定它的用途、格式、维度等属性。它扮演的更多时候是一个数据容器，也就是纹素的容器。

``` js
// 普通贴图
const texture = device.createTexture({
  size: [512, 512, 1],
  format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING 
  	| GPUTextureUsage.COPY_DST
  	| GPUTextureUsage.RENDER_ATTACHMENT,
})

// 深度纹理
const depthTexture = device.createTexture({
  size: [800, 600],
  format: 'depth24plus',
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
})

// 从 canvas 中获取纹理
const gpuContext = canvas.getContext('webgpu')
const canvasTexture = gpuContext.getCurrentTexture()
```

上面介绍了三种创建纹理的方式，前两种类似，格式和用途略有不同；最后一个是来自 Canvas 的。

> 注意一点，有一些纹理格式并不是默认就支持的。如果需要特定格式，有可能还要在请求设备对象时，附上功能列表（`requiredFeatures`）



## 2.2. 纹理数据写入与拷贝

知道创建纹理对象，还要知道如何往其中写入来自 JavaScript 运行时的图像资源。

**首先，介绍纹理数据写入。**

有两个手段可以向纹理对象写入数据：

- 使用 `ImageBitmap` API（`globalThis.createImageBitmap()`）
- 使用解码后的 RGBA 数组

对于第一种，使用队列对象的 `copyExternalImageToTexture()` 方法，配合浏览器自带的 API，在队列时间轴上完成外部数据拷入纹理对象：

``` js
const diffuseTexture = device.createTexture({ /* ... */ })

/** 方法一 借助 HTMLImageElement 解码 **/
const img = document.createElement('img')
img.src = require('/assets/diffuse.png')
await img.decode()
const imageBitmap = await createImageBitmap(img)
/** 方法一 **/

/** 方法二 使用 Blob **/
const blob = await fetch(url).then((r) => r.blob())
const imageBitmap = await createImageBitmap(blob)
/** 方法二 **/

device.queue.copyExternalImageToTexture(
  { source: imageBitmap },
  { texture: diffuseTexture },
  [imageBitmap.width, imageBitmap.height]
)
```

上述例子提供了两种思路，第一种借助浏览器的 img 元素，也即 `Image` 来完成图像的网络请求、解码；第二种借助 `Blob` API；随后，使用 `Image(HTMLImageElement)`/`Blob` 对象创建一个 `ImageBitmap`，并进入队列中完成数据拷贝。

对于第二种，使用队列对象的 `writeTexture()` 方法，在队列时间轴上完成外部数据拷入纹理对象：

``` js
const imgRGBAUint8Array = await fetchAndParseImageToRGBATypedArray('/assets/diffuse.png')
const arrayBuffer = imgRGBAUint8Array.buffer

device.queue.writeTexture(
  { 
    bytePerRow: 4 * 512, // 每行多少字节
    rowsPerImage: 512 // 这个图像有多少行
  },
  arrayBuffer,
  { texture: diffuseTexture },
  [512, 512, 1]
)
```

第二种方法相对来说比较消耗性能，因为需要浏览器 API（例如借助 canvas 绘图再取数据）或其它手段（如 wasm 等）解码图像二进制至 RGBA 数组，不太适合每帧操作。



**其次，介绍纹理拷贝。**

与 WebGL 需要使用 FBO 或重新渲染不同，WebGPU 原生就在指令编码器上提供了纹理复制操作有关的 API：使用 `commandEncoder.copyTextureToTexture()` 可以完成纹理之间的拷贝，使用 `commandEncoder.copyBufferToTexture()`、`commandEncoder.copyTextureToBuffer()` 可以在缓冲对象和纹理对象之间的拷贝（以便读取纹素数据）。

以纹理间的拷贝为例：

``` js
commandEncoder.copyTextureToTexture({
  texture: mipmapTexture,
  mipLevel: 4,
}, {
  texture: destTexture,
  mipLevel: 5,
}, [512, 512, 1])
```

这个例子将 Mipmap 纹理的第 4 级拷贝至目标纹理对象的第 5 级，纹理的大小是 `512 × 512`，需要注意 `mipmapTexture` 和 `destTexture` 的 `usage`，复制源需要有 `GPUTextureUsage.COPY_SRC`，复制目标要有 `GPUTextureUsage.COPY_DST`.

既然发生在指令编码器上，那就意味着操作纹理时，与普通的渲染通道、计算通道是平级的 —— 换句话说，拷贝纹理的行为，必须在渲染通道之前或之后进行。



## 2.3. 纹理视图

因官方文档在我写这篇文章前，都没有给出纹理视图对象的描述，所以下面的描述是我根据 WebGPU 中关于纹理方面的 API 猜测的。

当 CPU 需要使用纹理时，譬如进行纹理数据的写入，或者纹理对象之间的拷贝，会直接在队列上进行，而且传参给的就是 `GPUTexture` 本身；而 GPU 需要使用纹理时，例如资源绑定组绑定一个纹理，或者渲染通道的附件需要使用容器时，通常传参给的是 `GPUTextureView`；所以，我猜测：

- 纹理对象适用于 CPU 侧操作
- 纹理视图对象为 GPU 提供操作真正纹理数据的一个窗口

创建纹理视图其实很简单，它通过调用纹理对象本身的 `createView()` 方法创建：

``` js
const view = texture.createView()

// 在渲染通道的颜色附件中
const renderPassDescriptor = {
  colorAttachments: [
    {
      view: canvasTexture.createView(),
      // ...
    }
  ]
}
```

纹理视图对象是可以传递参数对象的，类型是 `GPUTextureViewDescriptor`，当然这个参数对象是可选的。这个参数对象可以更具体描述纹理视图。

譬如，立方体纹理创建视图时，需要明确指定其维度（`dimension`）参数等参数：

``` js
const cubeTextureView = cubeTexture.createView({
  dimension: 'cube',
  arrayLayerCount: 6,
})
```



## 2.4. 着色器中的纹理与采样器

与 WebGL 使用的阉割版 GLSL 相比，WGSL 提供的类型就多多了。

WebGL 1.0 中的采样参数与 WebGL 2.0 姗姗来迟的 `WebGLSampler` 类型，在 WebGPU 和 WGSL 中统一为具体的变量类型，即 WebGPU 对应 `GPUSampler`，WGSL 对应 `sampler` 和 `sampler_comparision` 类型。

WGSL 中的纹理类型有十几种，纹理类型与纹理视图的 `dimension` 参数是紧密相关的，参考 [WebGPU Spec - TextureView Creation](https://gpuweb.github.io/gpuweb/#texture-view-creation)

而纹理相关的函数也跟随着增多了许多，且各有用途，有最常规的纹理采样函数 `textureSample`，读取单个纹素的 `textureLoad` 函数，获取纹理尺寸的 `textureDimensions`（等价于 WebGL 2.0 的 `textureSize`），向存储型纹理写纹素的 `textureStore` 等，每个函数又有若干种重载。

最基本的用法，使用二维 f32 纹理对象、采样器、纹理坐标进行采样：

``` wgsl
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_2d<f32>;

@stage(fragment)
fn main(@location(0) fragUV: vec2<f32>) -> @location(0) vec4<f32> {
	return textureSample(myTexture, mySampler, fragUV);
}
```



## 2.5. WebGPU 中的 Mipmapping

鉴于纹理技术本身的复杂性，官方在 [GitHub issue 386](https://github.com/gpuweb/gpuweb/issues/386) 中关于自动生成 Mipmap 的 API 有激烈的讨论，目前倾向于不实现，把 Mipmap 的生成实现交给社区。

WebGPU 保留了 Mipmap 的支持，但是没有像 WebGL 一样提供简便的 `gl.generateMipmap(gl.TEXTURE_2D)` 调用方法一键生成，需要自己对纹理的每一个层生成。

幸运的是，WebGPU 社区的 Toji 大佬编写了一个工具来生成纹理的 Mipmap：[web-texture-tool/src/webgpu-mipmap-generator.js](https://github.com/toji/web-texture-tool/blob/main/src/webgpu-mipmap-generator.js)，原理就是开辟一个新的指令编码器，使用一条特定的渲染管线离屏计算每一级 mipmap，最终写入一个纹理对象并返回。若源纹理具备渲染附件的用途（`GPUTextureUsage.RENDER_ATTACHMENT`），那么就在源纹理上生成，否则会使用 `commandEncoder.copyTextureToTexture()` 方法把工具类内部创建的临时 mipmap 纹理对象拷贝到源纹理对象。

目前只能对 `"2d"` 类型的纹理起作用，这个类的简单用法如下：

``` js
import { WebGPUMipmapGenerator } from 'web-texture-tool/webgpu-mipmap-generator.js'

/* -- 常规创建纹理 -- */
const textureDescriptor = { /**/ }
const srcTexture = device.createTexture(textureDescriptor)

/* -- 为纹理创建 mipmap -- */
const mipmapGenerator = new WebGPUMipmapGenerator(device)
mipmapGenerator.generateMipmap(srcTexture, textureDescriptor)

// ...
```

`generateMipmap()` 方法执行后，将在 2d 纹理的每个 `layer` 创建完成每一层 Mipmap，顺带一提，这个工具并未完全稳定，请考虑各种风险。

注意一点，这个 `textureDescriptor` 的 `mipLevelCount` 是有一个 [算法](https://gpuweb.github.io/gpuweb/#abstract-opdef-maximum-miplevel-count) 的，它必须小于等于根据纹理维度、纹理尺寸计算的 **最大限制值**。这里纹理维度是 2d 类型，最大尺寸是 64，那么容易算得最大 mipLevel 是 `Math.floor(Math.log2(64)) + 1 = 7`.

``` js
const textureDescriptor = {
  // ...
  mipLevelCount: 7, // 创建纹理时，允许人为指定 mipmap 有多少级，但是不超最大限制
  size: {
    width: 64,
    height: 64,
    depthOrArrayLayers: 1
  },
  dimension: "2d"
}
```

> 扩展阅读：ThreeJS 关于 WebGPU 这项议程，参考了 Toji 的工具，集成到 `WebGPUTextureUtils` 类，有关讨论见 [ThreeJS pull 20284 WebGPUTextures: Add support for mipmap computation.](https://github.com/mrdoob/three.js/pull/20284)



# 3. 纹理压缩编码算法

> 涉及到压缩纹理格式我更是只能“纸上谈兵”，这一段仅作为个人知识浅表性的记录，道阻且长...

这一小节其实与 WebGL、WebGPU 的接口并无太大关系，纹理压缩算法，或者说压缩纹理格式，是另外的一门技术，WebGL 和 WebGPU 在底层实现上做了支持。

简单的说，压缩纹理格式是一种“时间+空间换空间”的产物，需要提前生成，常见的封装文件格式有 `ktx2` 等（就好比 `h264/5` 于 `.mp4`）。它有效地节约了 GPU 显存，并且解压速度比传统的 Web 图像格式 `jpg`、`png` 更快，它本身也比 `jpg/png` 的文件体积要小一些。

不过很遗憾的是，诸多压缩编码算法在各个软硬件厂商的实现都不太一样，没法像 `jpg/png` 一样广泛、普遍使用。

为了兼容性，通常会针对不同平台生成不同的压缩纹理备用，也就是所谓的“时间+空间换解压时间+显存空间”。

WebGL 1.0 只能使用 2D 纹理，WebGL 2.0 支持使用 3D 纹理，而且对压缩纹理的使用，是需要借助扩展项来完成的。例如：

``` js
const ext = (
  gl.getExtension('WEBGL_compressed_texture_s3tc') ||
  gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
  gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc')
)

const texture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, texture)
gl.compressedTexImage2D(gl.TEXTURE_2D, 0, ext.COMPRESSED_RGBA_S3TC_DXT5_EXT, 512, 512, 0, textureData)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
```

这个示例代码展示了在 WebGL 1.0 通过 `compressedTexImage2D()` 方法使用了一个 `S3TC_DXT5` 压缩编码的纹理数据 `textureData`.

具体的 WebGL 1/2 压缩扩展和用法参考 [MDN - compressedTexImage[23]D()](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compressedTexImage2D)

对于 WebGPU，它支持三类压缩格式：

- texture-compression-bc
- texture-compression-etc2
- texture-compression-astc

请求设备对象时传入 `requiredFeatures` 即可请求所需压缩纹理格式：

``` js
// 以 astc 格式为例 -- 需要在适配器上判断是否支持此格式

const requiredFeatures = []
if (gpuAdapter.features.has('texture-compression-astc')) {
  requiredFeatures.push('texture-compression-astc')
}
const device = await adapter.requestDevice({
  requiredFeatures
})
```

当适配器支持时即可请求。这样，`astc` 族压缩纹理格式就全部可用了：

``` js
const compressedTextureASTC = device.createTexture({
  // ...
  format: "astc-10x6-unorm-srgb"
})
```

三大类型的压缩纹理格式支持列表参考 [WebGPU Spec - Feature Index: 24.4, 24.5, 24.6](https://gpuweb.github.io/gpuweb/#feature-index)

幸运的是，Toji 的库 [toji/web-texture-tool](https://github.com/toji/web-texture-tool) 也为纹理的加载写了两种 Loader，用于 WebGL 和 WebGPU 中纹理数据的生成，支持压缩格式。

纹理压缩算法（格式）简单记忆规则：

- `ETC1/2 - Android`
- `DXT/S3TC - Windows`
- `PVRTC - Apple`
- `ASTC - Will Be The Future`

详细的资料在文末的参考资料里了。



# 4. 总结

> 关于 Mipmap、级联纹理、压缩格式等进阶知识，我觉得已经超出了这两个 API 比对的范围，况且个人理解尚不深，就不关公面前舞大刀了。

这篇与上篇相隔时间较长，我在学习的过程中补充了很多欠缺的知识，为了严谨和准确性也查阅了不少的例子、啃了不少的源码。

简而言之，WebGPU 把 WebGL 1/2 两代的纹理接口进行了科学统一，并且出厂自带压缩纹理格式的支持（当然，还是看具体平台的，需要按需选取）。

其中最让我感兴趣的就是 WebGPU 对纹理的二级细化，提供 `GPUTexture` 和 `GPUTextureView` 两级 API，发文时还未见到官方规范解释这两个 API，猜测前者专注于数据的 IO，后者则提供纹理数据的一层视图（根据参数具象化纹理数据的某一方面）。

很遗憾，发文时我还没深入了解过存储型纹理，以后介绍 GPGPU 时再说吧。



# 参考资料

- [WebGLFundamentals - CubeMaps](https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-cube-maps.html)
- [WebGLFundamentals - WebGL 图像处理](https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-image-processing.html)
- [郭隆邦 - ThreeJS 环境贴图](http://www.yanhuangxueyuan.com/doc/Three.js/envMap.html)
- [掘金 - WebGL学习之纹理盒](https://juejin.cn/post/6844903838491607048)
- [掘金 - WebGL2系列之多采样渲染缓冲对象](https://juejin.cn/post/6844903889678909447)
- [CSDN - Three.js 使用设置envMap环境贴图创建反光效果](https://blog.csdn.net/qq_30100043/article/details/80186810)
- [CSDN - WebGL着色器GLSL ES内置函数](https://blog.csdn.net/u014291990/article/details/103172267)
- [知乎 - WebGL 纹理详解](https://zhuanlan.zhihu.com/p/68894334)
- [WebGL2Fundamentals - WebGL2 纹理](https://webgl2fundamentals.org/webgl/lessons/zh_cn/webgl-3d-textures.html)
- [WebGL2Fundamentals - WebGL2 有什么新内容](https://webgl2fundamentals.org/webgl/lessons/zh_cn/webgl2-whats-new.html)
- [WebGL2Fundamentals - 迁移WebGL1到WebGL2](https://webgl2fundamentals.org/webgl/lessons/zh_cn/webgl1-to-webgl2.html)
- [WebGL 纹理](https://chinese.freecodecamp.org/news/webgl-texture/)
- [WebGL纹理详解之一：纹理的基本使用](http://www.jiazhengblog.com/blog/2015/12/10/2772/)
- [WebGL纹理详解之三：纹理尺寸与Mipmapping](http://www.jiazhengblog.com/blog/2016/01/05/2882/)
- [MDN - WEBGL_draw_buffers](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_draw_buffers)
- [GithubIO - WebGL 纹理详解](https://xieguanglei.github.io/blog/post/webgl-texture.html)
- [知乎 - 你所需要了解的几种纹理压缩格式原理](https://zhuanlan.zhihu.com/p/237940807)
