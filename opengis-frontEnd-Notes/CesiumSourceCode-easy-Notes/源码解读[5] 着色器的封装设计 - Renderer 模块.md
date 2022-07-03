本篇涉及到的所有接口在公开文档中均无，需要下载 GitHub 上的源码，自己创建私有类的文档。

``` sh
npm run generateDocumentation -- --private
yarn generateDocumentation -- --private
pnpm generateDocumentation -- --private
```

本篇当然不会涉及着色器算法讲解。



# 1. 对 WebGL 接口的封装

任何一个有追求的 WebGL 3D 库都会封装 WebGL 原生接口。CesiumJS 从内部封测到现在，已经有十年了，WebGL 自 2011 年发布以来也有 11 年了，这期间小修小补不可避免。

更何况 CesiumJS 是一个 JavaScript 的地理 3D 框架，它在源代码设计上具备两大特征：

- 面向对象
- 模块化

关于模块化策略，CesiumJS 在 1.63 版本已经从 `require.js` 切换到原生 `es-module` 格式了。而 WebGL 是一种使用全局状态的指令式风格接口，改为面向对象风格就必须做封装。ThreeJS 是通用 Web3D 库中做 WebGL 封装的代表作品。

封装有另外的好处，就是底层 WebGL 接口在这十多年中的变化，可以在封装后屏蔽掉这些变化，上层应用调用封装后的 API 方式基本不变。

## 1.1. 缓冲对象封装

CesiumJS 封装了 `WebGLBuffer` 以及 WebGL 2.0 才正式支持（1.0 中用扩展）的 VAO，分别封装成了 `Buffer` 类和 `VertexArray` 类。

`Buffer` 类比较简单，提供了简单工厂模式的静态创建方法：

``` js
// 创建存储顶点缓冲对象
Buffer.createVertexBuffer = function (options) {
  // ...

  return new Buffer({
    context: options.context,
    bufferTarget: WebGLConstants.ARRAY_BUFFER,
    typedArray: options.typedArray,
    sizeInBytes: options.sizeInBytes,
    usage: options.usage,
  });
};

// 创建顶点索引缓冲对象
Buffer.createIndexBuffer = function (options) {
  // ...
};
```

`Buffer` 对象在实例化时，就会创建 `WebGLBuffer` 并将类型数组上载：

``` js
// Buffer 构造函数中
const buffer = gl.createBuffer();
gl.bindBuffer(bufferTarget, buffer);
gl.bufferData(bufferTarget, hasArray ? typedArray : sizeInBytes, usage);
gl.bindBuffer(bufferTarget, null);
```

除了这两个用于创建的静态方法，还有一些拷贝缓冲对象的方法，就不一一列举了。

注意一点：**`Buffer` 对象不保存原始顶点类型数组数据。**这一点是出于节约 JavaScript 内存考虑。

而顶点数组对象 `VertexArray`，封装的则是 OpenGL 系中的一个数据模型 `VertexArrayObject`，在 WebGL 中是意图节约设置多个顶点缓冲到全局状态对象的性能损耗。

创建 CesiumJS 的顶点数组对象也很简单，只需按 WebGL 的顶点属性（Vertex Attribute）的格式去装配 `Buffer` 对象即可：

``` js
const positionBuffer = Buffer.createVertexBuffer({
  context: context,
  sizeInBytes: 12,
  usage: BufferUsage.STATIC_DRAW
})
const normalBuffer = Buffer.createVertexBuffer({
  context: context,
  sizeInBytes: 12,
  usage: BufferUsage.STATIC_DRAW
})
const attributes = [
  {
    index: 0,
    vertexBuffer: positionBuffer,
    componentsPerAttribute: 3,
    componentDatatype: ComponentDatatype.FLOAT
  },
  {
    index: 1,
    vertexBuffer: normalBuffer,
    componentsPerAttribute: 3,
    componentDatatype: ComponentDatatype.FLOAT
  }
]
const va = new VertexArray({
  context: context,
  attributes: attributes
})
```

你如果在对着上述代码练习，你肯定没法成功创建，并发现一个问题：没有 `context` 参数传递给 `Buffer` 或 `VertexArray`，因为 `context` 对象（类型 `Context`）是 WebGL 渲染上下文对象等底层接口的的封装对象，没有它无法创建 `WebGLBuffer` 等原始接口对象。

所以，`Buffer`、`VertexArray` 并不是孤立的 API，必须与其它封装一起搭配来用，它们两个至少要依赖 `Context` 对象才行，在 1.4 中会介绍如何使用 `Context` 类封装 WebGL 底层接口并如何访问 `Context` 对象的。

很少有需要直接创建 `Buffer`、`VertexArray` 的时候，使用这两个接口，就意味着你获得的数据符合 `VBO` 格式，其它人类阅读友好型的数据格式必须转换为 VBO 格式才能直接用这俩类。如果你需要使用第 2 节中提及的指令对象，这两个类就能派上用场了。

## 1.2. 纹理与采样参数封装

纹理是 WebGL 中一个非常复杂的话题。

先说采用参数吧，在 WebGL 1.0 时还没有原生的采样器 API，到 2.0 才推出的 `WebGLSampler` 接口。所以，CesiumJS 封装了一个简单的 `Sampler` 类：

``` js
function Sampler(options) {
  // ...
  this._wrapS = wrapS;
  this._wrapT = wrapT;
  this._minificationFilter = minificationFilter;
  this._magnificationFilter = magnificationFilter;
  this._maximumAnisotropy = maximumAnisotropy;
}
```

其实就是把 WebGL 1.0 中的纹理采样参数做成了一个对象，没什么难的。

纹理类 `Texture` 则是对 `WebGLTexture` 的封装，它不仅封装了 `WebGLTexture`，还封装了数据上载的功能，只需安心地把贴图数据传入即可。

同 `Buffer`、`VertexArray`，`Texture` 也要 `context` 参数。

``` js
import {
  Texture, Sampler,
} from 'cesium'

new Texture({
  context: context,
  width: 1920,
  height: 936,
  source: new Float32Array([/* ... */]), // 0~255 灰度值的 RGBA 图像数据
  // 可选采样参数
  sampler: new Sampler()
})
```

你可以在 `ImageryLayer.js` 模块中找到创建影像瓦片纹理的代码：

``` js
ImageryLayer.prototype._createTextureWebGL = function (context, imagery) {
  // ...
  return new Texture({
    context: context,
    source: image,
    pixelFormat: this._imageryProvider.hasAlphaChannel
      ? PixelFormat.RGBA
      : PixelFormat.RGB,
    sampler: sampler,
  });
}
```

除了创建纹理，CesiumJS 还提供了纹理的拷贝工具函数，譬如从帧缓冲对象中拷贝出一个纹理：

``` js
Texture.fromFramebuffer = function (/* ... */) { /* ... */ }

Texture.prototype.copyFromFramebuffer = function (/* ... */) { /* ... */ }
```

或者创建 mipmap：

``` js
Texture.prototype.generateMipmap = function (/* ... */) { /* ... */ }
```



## 1.3. 着色器封装

众所周知，WebGL 的着色器相关 API 是 `WebGLShader` 和 `WebGLProgram`，顶点着色器和片元着色器共同构成一个着色器程序对象。在一帧的渲染中，由多个通道构成，每个通道在触发 `draw` 动作之前，通常要切换着色器程序，以达到不同的计算效果。

CesiumJS 的渲染远远复杂于通用 Web3D，意味着有大量着色器程序。对象多了，就要管理。CesiumJS 封装了有关底层 API 的同时，还设计了缓存机制。

CesiumJS 使用 `ShaderSource` 类来管理着色器代码文本，使用 `ShaderProgram` 类来管理 `WebGLProgram` 和 `WebGLShader`，使用 `ShaderCache` 类来缓存 `ShaderProgram`，再使用 `ShaderFunction`、`ShaderStruct`、`ShaderDestination` 来辅助 `ShaderSource` 处理着色器代码文本中的 glsl 函数、结构体成员、宏定义。

此外，还有一个 `ShaderBuilder` 类来辅助 `ShaderProgram` 的创建。

这一堆私有类与前面 `Buffer`、`VertexArray`、`Texture` 一样，并不能单独使用，通常是与第 2 节中的各种指令对象一起用。

下面给出一个例子，它使用 `ShaderProgram` 的静态方法 `fromCache` 创建着色器程序对象，这个方法会创建对象的同时并缓存到 `ShaderCache` 对象中，有兴趣的可以自行查看缓存的代码。

``` js
const vertexShaderText = `attribute vec3 position;
 void main() {
   gl_Position = czm_projection * czm_view * czm_model * vec4(position, 1.0);
 }`
const fragmentShaderText = `uniform vec3 u_color;
 void main(){
   gl_FragColor = vec4(u_color, 1.0);
 }`
 
const program = ShaderProgram.fromCache({
  context: context,
  vertexShaderSource: vertexShaderText,
  fragmentShaderSource: fragmentShaderText,
  attributeLocations: {
    "position": 0,
  },
})
```

完整例子可以找我之前的写的关于使用 `DrawCommand` 绘制三角形的文章。



## 1.4. 上下文对象与渲染通道

WebGL 底层接口的封装，基本上都在 `Context` 类中。最核心的就是渲染上下文（`WebGLRenderingContext`、`WebGL2RenderingContext`）对象了，除此之外，`Context` 上还有一些重要的渲染相关的功能和成员变量：

- 一系列 WebGL 2.0 中才支持的、WebGL 1.0 中用扩展才支持的特性
- 压缩纹理的支持信息
- `UniformState` 对象
- `PassState` 对象
- `RenderState` 对象
- 参与帧渲染的功能，譬如 draw、readPixels 等
- 创建拾取用的 PickId
- 操作、校验 `Framebuffer` 对象

通常，通过 `Scene` 对象上的 `FrameState` 对象，即可访问到 `Context` 对象。

WebGL 渲染上下文对象暴露的常量很多，CesiumJS 把渲染上下文上的常量以及可能会用到的常量都封装到 `WebGLConstants.js` 导出的对象中了。

还有一个东西要特别说明，就是通道，WebGL 是没有通道 API 的，而一帧之内切换着色器进行多道绘制过程是很常见的事情，每一道触发 `draw` 的行为，叫做通道。

CesiumJS 把高层级三维对象的渲染行为做了打包，封装成了三类指令对象，在第 2 节中会讲；这些指令对象是有先后优先级的，CesiumJS 把这些优先级描述为通道，使用 `Pass.js` 导出的枚举来定义，目前指令对象有 10 个优先级：

``` js
const Pass = {
  ENVIRONMENT: 0,
  COMPUTE: 1,
  GLOBE: 2,
  TERRAIN_CLASSIFICATION: 3,
  CESIUM_3D_TILE: 4,
  CESIUM_3D_TILE_CLASSIFICATION: 5,
  CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW: 6,
  OPAQUE: 7,
  TRANSLUCENT: 8,
  OVERLAY: 9,
  NUMBER_OF_PASSES: 10,
};
```

`NUMBER_OF_PASSES` 成员代表当前有 10 个优先级。

而在帧状态对象上，也有一个 `passes` 成员：

``` js
// FrameState 构造函数
this.passes = {
  render: false,
  pick: false,
  depth: false,
  postProcess: false,
  offscreen: false,
};
```

这 5 个布尔值就控制着渲染用的是哪个通道。

指令对象的通道状态值，加上帧状态对象上的通道状态，共同构成了 CesiumJS 庞大的抽象模型中的“通道”概念。

> 其实我认为这样设计会导致 Scene 单帧渲染时有大量的 if 判断、排序处理，显得有些冗余，能像 WebGPU 这种新 API 一样提供通道编码器或许会简化通道的概念。



## 1.5. 统一值（uniform）封装

统一值，即 WebGL 中的 `Uniform`，不熟悉的读者需要自己先学习 WebGL 相关概念。

每一帧，有大量的状态值是和上一帧不一样的，也就是需要随时更新进着色器中。CesiumJS 为此做出了封装，这种频繁变动的统一值被封装进了 `AutomaticUniforms` 对象中了，每一个成员都是 `AutomaticUniform` 类实例：

``` js
// AutomaticUniforms.js 中
function AutomaticUniform(options) {
  this._size = options.size;
  this._datatype = options.datatype;
  this.getValue = options.getValue;
}
```

从默认导出的 `AutomaticUniforms` 对象中拿一个成员来看：

``` js
czm_projection: new AutomaticUniform({
  size: 1,
  datatype: WebGLConstants.FLOAT_MAT4,
  getValue: function (uniformState) {
    return uniformState.projection;
  },
})
```

这个统一值是摄像机的投影矩阵，它的取值函数需要一个 `uniformState` 参数，也就是实时地从统一值状态对象（类型 `UniformState`）上获取的。

`Context` 对象拥有一个只读的 `UniformState` getter，指向一个私有的成员。当 `Scene` 在执行帧状态上的指令列表时，会调用 `Context` 的绘制函数，进一步地会调用 `Context.js` 模块内的 `continueDraw` 函数，它就会执行着色器程序对象的 `_setUniforms` 方法：

``` js
shaderProgram._setUniforms(
  uniformMap,
  context._us,
  context.validateShaderProgram
);
```

这个函数就能把指令对象传下来的自定义 `uniformMap`，以及 `AutomaticUniforms` 给设置到 `ShaderProgram` 内置的 `WebGLProgram` 上，也就是完成着色器内统一值的设置。



## 1.6. 渲染容器封装

渲染容器主要就是指帧缓冲对象、渲染缓冲对象。

渲染缓冲对象，CesiumJS 封装为 `Renderbuffer` 类，是对 `WebGLRenderbuffer` 的一个非常简单的封装，不细说了，但是要单独提一点，若启用了 msaa，会调用相关的绑定函数：

``` js
// Renderbuffer.js

function Renderbuffer(options) {
  // ...
  const gl = context._gl;

  // ...
  this._renderbuffer = this._gl.createRenderbuffer();

  gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderbuffer);
  if (numSamples > 1) {
    gl.renderbufferStorageMultisample(
      gl.RENDERBUFFER,
      numSamples,
      format,
      width,
      height
    );
  } else {
    gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);
  }
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
}
```

接下来说帧缓冲的封装。

普通的帧缓冲，也就是常规的 `WebGLFramebuffer` 被封装到 `Framebuffer` 类里了，它有几个数组成员，用于保存帧缓冲用到的颜色附件、深度模板附件的容器纹理、容器渲染缓冲。

``` js
function Framebuffer(options) {
  const context = options.context;
  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.context", context);
  //>>includeEnd('debug');

  const gl = context._gl;
  const maximumColorAttachments = ContextLimits.maximumColorAttachments;

  this._gl = gl;
  this._framebuffer = gl.createFramebuffer();

  this._colorTextures = [];
  this._colorRenderbuffers = [];
  this._activeColorAttachments = [];

  this._depthTexture = undefined;
  this._depthRenderbuffer = undefined;
  this._stencilRenderbuffer = undefined;
  this._depthStencilTexture = undefined;
  this._depthStencilRenderbuffer = undefined;
  
  // ...
}
```

用也很简单，调用原型链上绑定相关的方法即可。CesiumJS 支持 MRT，所以有一个对应的 `bindDraw`  方法：

``` js
Framebuffer.prototype.bindDraw = function () {
  const gl = this._gl;
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this._framebuffer);
};
```

msaa 则用到了 `MultisampleFramebuffer` 这个类；CesiumJS 还设计了 `FramebufferManager` 类来管理帧缓冲对象，在后处理、OIT、拾取、Scene 的帧缓冲管理等模块中均有使用。



# 2. 三类指令

CesiumJS 并不会直接处理地理三维对象，而是在各种更新的流程控制函数中，由每个三维对象去生成一种叫做“指令”的对象，送入帧状态对象的相关渲染队列中。

这些指令对象的就屏蔽了各种高层级的“人类友好”型三维数据对象的差异，`Context` 能方便统一地处理它们携带的数据资源（缓冲、纹理）和行为（着色器）。

这些指令对象分成三类：

- 绘图指令（绘制指令），`DrawCommand` 类，负责渲染绘图
- 清屏指令，`ClearCommand` 类，负责清空绘图区域
- 通用计算指令，`ComputeCommand` 类，用 WebGL 来进行 GPU 并行计算

下面进行简单讲解。

## 2.1. 绘图指令（绘制指令）



## 2.2. 清屏指令



## 2.3. 通用计算指令



# 3. 自定义着色器

CesiumJS 留有一些公开的 API，允许开发者写自己的着色过程。

在 Cesium 团队大力开发下一代 3DTiles 和模型类新架构之前，这部分能力比较弱，只有一个 `Fabric` 材质规范能写写现有几何对象的材质效果，且文档较少。

随着下一代 3DTiles 与新的模型类实验性启用后，带来了自由度更高的 `CustomShader API`，不仅仅有齐全的文档，而且给到开发者最大的自由去修改图形渲染。

## 3.1. 早期 Fabric 材质规范中的自定义着色器



## 3.2. 新架构带来的 CustomShader API

