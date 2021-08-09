下面一行代码，是片元着色器中的一个代码。

``` glsl
gl_FragColor = texture2D(<sample2D>, <uv::vec2>);
```

- gl_FragColor 是 WebGL 中的内置变量，即片元颜色
- texture2D 是 WebGL 的内置函数，用到一个 sample2D 类型的 uniform 纹理数据，和一个 vec2 类型的 varying（意味着从顶点着色器导入uv坐标）uv坐标

> 这就可以做手脚了，sample2D 这个纹理图片是固定的，在顶点着色器或片元着色器可以任意修改uv，达到变换位置的效果。

# texture2D 内置函数

## ① 参数列表

- sample2D sampler：纹理数据
- vec2 uv：uv坐标
- [float bias]：可选参数。参数bias只可在片元着色器中使用，它表示在sample是MIPMAP纹理时，加在当前lod上的值（出自[webgl内置函数--矢量函数与纹理查询函数 (juejin.cn)](https://juejin.cn/post/6844903697743347725)）。

## ② 返回值

vec4，即给定的 uv 坐标处的纹理颜色。

# 这个 uniform 的 sample2D 纹理哪来的？

## 当然常规的是从图片数据来

``` js
let texture = gl.createTexture();
let image = new Image();
image.src = "./resource/image.png";
image.addEventListener('load', () => {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
})
```

其中，`gl.texImage2D()` 函数就为 WebGL 指定了纹理（参考[WebGLRenderingContext.texImage2D() - Web API 接口参考 | MDN (mozilla.org)](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/texImage2D)）

注意到最后一个参数是 image 实例，在 WebGL1 和 WebGL2 中支持的类型有所不同：

|                | WebGL1                                                       | WebGL2                                         |
| -------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| 支持的数据类型 | ImageData、HTMLImageElement、HTMLCanvasElement、HTMLVideoElement、ImageBitmap | WebGL1中的所有类型 + GLintptr、ArrayBufferView |

其中，WebGL2 的 ArrayBufferView 支持的 ArrayBuffer 有：Uint8Array、Uint16Array、Uint32Array、Float32Array

## 也可以自己用像素填充

``` js
let texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
// 用 1x1 个蓝色像素填充纹理
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
```

