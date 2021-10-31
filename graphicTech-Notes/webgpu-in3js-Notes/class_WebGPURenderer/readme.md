# 类 WebGPURenderer

这个类可以说是入门时除了 Three.JS 原本核心类之外接触的第一个“新”类。

它最重要的方法莫过于 `render` 方法了，`render` 方法可以说是 Three.JS 中几乎所有渲染器类的第一方法，它对传入的场景对象和相机对象进行每一帧的渲染调度工作（通常在被 rAF 函数体中调用）。



## 内部参数

这些参数是 ThreeJS 运行时的参数，控制台应该是无法访问的，作用域应该是在模块内。

- 截头体对象 `Frustum`
- 投影矩阵 `Matrix4`
- 三维向量 `Vector3`

此外，这个类的模块一旦加载，会修改 Matrix4 类原来 `makePerspective` 和 `makeOrthographic` 两个方法的定义，因为在原来 WebGL 体系中这两个方法与 WebGPU 体系并不兼容，应该是左右手坐标系导致的。



## 构造参数

截至2021年11月1日，类型库（https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/three）中还未正式为 WebGPU 相关的类进行定义，所以我擅自定义其为 `WebGPURendererParam` 类型。

``` typescript
type WebGPURendererParam = {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  sampleCount?: number; // 1 或者 4
  requiredFeatures?: []; // 不完整
  requiredLimits?: {}; // 不完整
  powerPreference?: string; // low 或者 high
  context?: GPUCanvasContext;
}
```



## 方法 render

todo



## 方法 getSize/setSize

### getSize

返回渲染器的长与宽。

### setSize

接受三个参数，前两个为渲染器的长宽值，第三个是可选的 bool 参数，用来判断是否更新 css 样式。

调用此方法会更新 canvas 本身的长宽，再由第三个参数 `updateStyle` 判断是否更新 css 的长宽。

最后会调用三个方法进行内部更新：

- [_configureContext](#方法 _configureContext)：重新配置 GPUCanvasContext，实际上完成大小调整是在这个方法；
- [_setupColorBuffer](#方法 _setupColorBuffer)：创建新的颜色缓存
- [_setupDepthBuffer](#方法 _setupDepthBuffer)：创建新的深度缓存



## 方法 init（异步）

首先会从参数对象（`this._parameters`）中获得用于创造适配器（GPUAdapter）的参数，然后请求适配器。

随后，再从参数对象获得用于创造设备（GPUDevice）的参数，然后请求设备。

紧接着，获取上下文对象（GPUCanvasContext）。

三大对象创建完成后，调用上下文对象的配置方法，即令 canvas 容器作为颜色纹理与设备对象结合在一起。

最后是创建一系列的渲染器所需对象：

``` js
this._info = new WebGPUInfo();
this._properties = new WebGPUProperties();
this._attributes = new WebGPUAttributes( device );
this._geometries = new WebGPUGeometries( this._attributes, this._info );
this._textures = new WebGPUTextures( device, this._properties, this._info );
this._objects = new WebGPUObjects( this._geometries, this._info );
this._nodes = new WebGPUNodes( this );
this._renderPipelines = new WebGPURenderPipelines( this, this._properties, device, parameters.sampleCount, this._nodes );
this._computePipelines = new WebGPUComputePipelines( device );
this._bindings = new WebGPUBindings( device, this._info, this._properties, this._textures, this._renderPipelines, this._computePipelines, this._attributes, this._nodes );
this._renderLists = new WebGPURenderLists();
this._background = new WebGPUBackground( this );

this._renderPassDescriptor = {
  colorAttachments: [ {
    view: null
  } ],
  depthStencilAttachment: {
    view: null,
    depthStoreOp: GPUStoreOp.Store,
    stencilStoreOp: GPUStoreOp.Store
  }
};

this._setupColorBuffer();
this._setupDepthBuffer();
```

可以看到有很多 WebGPU 中常见的概念，例如纹理、资源绑定组、两大管线等，还有一个 `_renderPassDescriptor`，是用来开一个新的渲染通道（GPURenderPassEncoder）用的。

最后两行是分别创建颜色纹理和深度纹理，见 [_setupColorBuffer](#方法 _setupColorBuffer) 和 [_setupDepthBuffer](#方法 _setupDepthBuffer)



## 方法 setPixelRatio

类型定义

``` typescript
class WebGPURenderer {
  setPixelRatio (value: number = 1): void { }
}
```

先将 value 赋予给 `_pixelRatio` 字段，然后调用 `setSize` 更新大小。

此方法更新横纵像素比例用，默认比例是 1。



## 方法 _setupColorBuffer

调取实例上的设备对象，若存在设备对象，则先判断是否存在颜色缓存；

存在颜色缓存，则销毁它；

不存在则直接调用设备对象的原生 WebGPU 方法来创建一个新的纹理，用于存储颜色缓存。



## 方法 _setupDepthBuffer

与 [_setupColorBuffer](#方法 _setupColorBuffer) 作用类似，创建新的深度缓存纹理对象。



## 方法 _configureContext

若设备对象存在于此实例上，则调用实例的 GPUCanvasContext 对象的 configure 方法重新配置 `device` 与 `canvas` 之间的联系，即默认颜色纹理作用容器 `canvas` 与 WebGPU 的关系 —— 调整 canvas 的纹理格式，调整 canvas 的作用类型（渲染附件），并重设 size。



## 方法 render

文本较长，单独写，见 [./method_render.md](./method_render.md)

