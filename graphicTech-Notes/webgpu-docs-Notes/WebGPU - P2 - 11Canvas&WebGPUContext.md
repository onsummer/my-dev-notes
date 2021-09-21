对应规范中 Canvas Rendering 一章

# 1 GPUCanvasContext

`GPUCanvasContext` 类型，其对象被称作 WebGPU 上下文。

它的作用就是让 HTML 上的 Canvas 元素，作为 WebGPU 中的一个纹理，与 WebGPU 进行渲染互动。

它的获取方法同 `WebGLRenderingContext`：

``` js
const canvas = document.createElement('canvas')
const context = canvas.getContext('webgpu')
```

但是它与 `WebGLRenderingContext` 最大的不同是，它只负责与 Canvas 的沟通，在 WebGPU 端简单地扮演着 Canvas 与 WebGPU 的沟通桥梁，让 Canvas 作为一个纹理对象；而后者除了上述职责外，还包括创建 WebGL 子对象，绑定、编译着色器、触发渲染等等等等。

它的定义如下：

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUCanvasContext {
  readonly attribute (HTMLCanvasElement or OffscreenCanvas) canvas;

  undefined configure(GPUCanvasConfiguration configuration);
  undefined unconfigure();

  GPUTextureFormat getPreferredFormat(GPUAdapter adapter);
  GPUTexture getCurrentTexture();
};
```

- `canvas` 属性，你可以再获取 Canvas 元素；
- `configure` 方法，用于配置 Canvas 的上下文，告诉 WebGPU 这个 Canvas 能扮演一个什么样的纹理对象；它接收一个对象参数，它的类型是 [GPUCanvasConfiguration](#2 GPUCanvasConfiguration 类型)；
- `unconfigure` 方法是 configure 方法的反作用，即取消配置，并移除配置时产生的纹理对象；
- `getPrefferedFormat` 方法接收一个适配器对象，返回一个合适适配器对象的纹理格式；
- `getCurrentTexture` 方法返回 Canvas 所扮演的那个 GPUTexture 对象，**需要注意的是**，每一帧都要使用这个方法获取对应的 GPUTexture（如果是渲染管线用到了颜色附件来输出的话）。



# 2 GPUCanvasConfiguration 类型

配置 Canvas 时的对象参数的类型。

``` web-idl
enum GPUCanvasCompositingAlphaMode {
  "opaque",
  "premultiplied",
};

dictionary GPUCanvasConfiguration {
  required GPUDevice device;
  required GPUTextureFormat format;
  GPUTextureUsageFlags usage = 0x10;  // 等价 GPUTextureUsage.RENDER_ATTACHMENT
  GPUPredefinedColorSpace colorSpace = "srgb";
  GPUCanvasCompositingAlphaMode compositingAlphaMode = "opaque";
  GPUExtent3D size;
};
```

- `device`，即设备对象；
- `usage`，纹理用途，Canvas 所扮演的纹理默认是用来做颜色附件，即默认值 `0x10`；
- `colorSpace`，Canvas 的色彩空间，只能是 "srgb"；
- `format`，`GPUTextureFormat` 类型，即 Canvas 所扮演的纹理对象的格式；
- `compositingAlphaMode`，[GPUCanvasCompositingAlphaMode](#GPUCanvasCompositingAlphaMode 枚举类型) 枚举类型，表示合成到 Canvas 上时的透明度选项，默认 "opaque"（不透明）；
- `size`，表示 Canvas 所扮演的纹理尺寸有多大，默认会用 Canvas 的画布宽高（而不是 CSS 宽高）。



## 举例

``` js
context.configure({
  device: someDevice,
  format: context.getPreferredFormat(someDevice.adapter),
  size: [
    context.canvas.clientWidth * devicePixelRatio,
    context.canvas.clientHeight * devicePixelRatio,
  ]
})
```



## GPUCanvasCompositingAlphaMode 枚举类型

"opaque" 表示 Canvas 扮演的纹理的合成选项是不透明；"premultiplied" 表示 Canvsa 扮演的纹理对象合成到 Canvas 时要与透明度预先相乘运算。



# 3 Canvas 尺寸变更问题

GPUCanvasContext 对象的 size 属性除非再次使用 `configure` 方法设置，否则是不变的。

如果在调用 configure 方法时没有明确指定其 size，那么它就会用 Canvas 对应的宽高。

如果在维度方面不匹配纹理对象，那么将会自动缩放以达到匹配。

与 `webgl` 或 `2d` 上下文对象不一样，WebGPU 上下文对象对应的 canvas 元素的画布宽高（而不是 CSS 的宽高）仅受下面两个因素影响：

- 画布默认的宽高（假如没被 CSS 隐藏）
- WebGPU 上下文对象调用 `configure` 方法时

> 译者注
>
> WebGPU 的绘图区域大小，它除了使用上下文对象的 configure 方法重设之外，没别的方法可以修改。在调用 configure 方法重设时，如果不指定 size 参数，那么它会自动读取 Canvas 元素的画布宽高（非CSS宽高）。

你可以使用下面的代码完成自动绘图分辨率匹配：

``` js
const canvas = document.createElement('canvas');
const context =  canvas.getContext('webgpu');

const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    if (entry != canvas) { continue; }
    context.configure({
      device: someDevice,
      format: context.getPreferredFormat(someDevice.adapter),
      size: {
        width: entry.devicePixelContentBoxSize[0].inlineSize,
        height: entry.devicePixelContentBoxSize[0].blockSize,
      }
    });
  }
});
resizeObserver.observe(canvas);
```

在 WebGL 中，通常每一帧都会执行 resize 函数以确保 CSS 分辨率和 canvas 分辨率一致，然后重设 viewport。
