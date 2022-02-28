- [ ] 纹理从外部如何输入（用什么函数，dimension，size等）

- [x] GPU 之间的传递过程（webgl 是 copy 函数？webgpu 是 copyTextureToTexture）

- [ ] 在 glsl & wgsl 中如何接收与采样

- [ ] 纹理的用途与格式

- [ ] 压缩纹理简介

---



### L3 从一个 WebGLTexture 拷贝到另一个 WebGLTexture

- WebGL 2.0 使用 `gl.blitFramebuffer()` 方法，借助帧缓冲对象为媒介，拷贝附着在两类附件上的关联纹理对象。下面为拷贝 renderableFramebuffer 的颜色附件的简单示例代码：

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

- WebGL 1.0 没那么便利，就只能自己封装比较麻烦一点的做法了，提供如下思路：
  - 把目标纹理附着到一个 FBO 上，利用一个 `WebGLProgram` 把源纹理通过着色器渲染进 FBO
  - 把源纹理附着到一个 FBO 上，利用 `gl.copyTexImage2D()` 或 `gl.copyTexSubImage2D()` 方法拷贝到目标纹理
  - 把源纹理附着到一个 FBO 上或直接绘制到 canvas 上，使用 `gl.readPixels()` 读取渲染结果，然后使用 `gl.texImage2D()` 将像素数据写入目标纹理（这个方法看起来很蠢，虽然技术上行得通）



### L3 从一个 GPUTexture 拷贝到另一个 GPUTexture

WebGPU 原生提供了 `commandEncoder.copyTextureToTexture()` 方法，就不要想着借助 renderPass 或读像素再写纹理的骚操作了（说不定性能更低），所以这里只介绍指令缓冲编码器上的 `copyTextureToTexture()` 方法。

不妨直接上例子：

``` js
const sourceTexture = device.createTexture({
  // ... 其它参数省略，但是 usage 一定要注意要有 COPY_SRC 和 COPY_DST
  usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING
})
const destinationTexture = device.createTexture({
  // ...
  usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
})

// ... 一系列操作

commandEncoder.copyTextureToTexture(
  { texture: sourceTexture },
  { texture: destinationTexture },
  [width, height, 1]
)
```





### L3 向 GPUTexture 传递数据

借助 queue.writeTexture 和 queue.copyExternalImageToTexture() 方法可以向 GPUTexture 写入数据。

writeTexture 需要的是 Uint8Array/Uint8ClampedArray 等 TypedArray，也就是原始的 rgba 数组，它的类型定义如下：

``` typescript
type BufferSource = ArrayBufferView | ArrayBuffer;
```



通常要经过 canvas2d 绘制再 canvasCtx.getImageData() 得到像素颜色值的类型数组。而能画在 canvas2d 上的多媒体资源，就比较多了：

``` typescript
type CanvasImageSource = HTMLOrSVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
```



copyExternalImageToTexture 要求就没那么高了，它要求的 source 是一个联合类型：

``` typescript
type GPUImageCopyExternalImageSource = ImageBitmap | HTMLCanvasElement | OffscreenCanvas
```

ImageBitmap 只是一个图像类，并不是 rgba 的数据数组；ImageBitmap 可以由 globalThis.createImageBitmap 异步创建而来，这个方法接受 HTML5 常见的多媒体元素。

【我觉得这里需要一个图，图像url字符串、canvas、多个HTMLXXXElement，以及 ImageBitmap，最终可以走什么样的路径，到达 GPUTexture】



---

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
  //因为位置是以几何中心为原点的,可以用顶点坐标作为法向量
  v_normal = normalize(a_position.xyz);
}

// 片元着色器
precision mediump float; // 从顶点着色器传入。
varying vec3 v_normal; // 纹理。
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

## 2.1. GPUTexture 的创建

注意 device 的 features，format 和 usage，以及 dimension



## 2.2. 纹理数据写入与拷贝

全在 [图像拷贝操作]



## 2.3. 纹理视图



## 2.4. 着色器中的纹理与采样器



## 2.5. WebGPU 中的 Mipmapping

需要自己创建，`GPUTexture` 只给了简单的接口

``` js
const texture = device.createTexture({
  // ...
  mipLevelCount: 7,
  size: [64, 64],
})
```

在官方 [GitHub issue 386](https://github.com/gpuweb/gpuweb/issues/386) 中关于自动生成 Mipmap 的 API 有激烈的讨论，目前倾向于不实现，把 Mipmap 的生成实现交给社区，因为纹理实在是太复杂了。

Toji 编写了一个工具（仍不稳定）来生成纹理的 Mipmap：[web-texture-tool/src/webgpu-mipmap-generator.js](https://github.com/toji/web-texture-tool/blob/main/src/webgpu-mipmap-generator.js)

ThreeJS 关于 WebGPU 这项议程，编写了一个 `WebGPUTextureUtils` 类，有关讨论见：[ThreeJS pull 20284 WebGPUTextures: Add support for mipmap computation.](https://github.com/mrdoob/three.js/pull/20284)



# 3. 纹理压缩编码算法

> 涉及到压缩纹理格式我更是只能“纸上谈兵”，这一段仅作为个人知识浅表性的记录，道阻且长...

Investigation: Compressed Texture Formats https://github.com/gpuweb/gpuweb/issues/144



# 4. 总结

> 关于 mipmap、级联纹理 等进阶货，我觉得已经超出了这两个 API 比对的范围，况且个人理解尚不深，就不关公面前舞大刀了。





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
