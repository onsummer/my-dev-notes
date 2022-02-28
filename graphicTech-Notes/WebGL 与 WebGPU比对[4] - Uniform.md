众所周知，在 GPU 跑可编程管线的时候，着色器是并行运行的，每个着色器入口函数都会在 GPU 中并行执行。每个着色器对一大片统一格式的数据进行冲锋，体现 GPU 多核心的优势，可以小核同时处理数据；不过，有的数据对每个着色器都是一样的，这种数据的类型是“uniform”，也叫做统一值。

这篇文章罗列了原生 WebGL 1/2 中的 uniform 资料，以及 WebGPU 中的 uniform 资料，有一些例子供参考，以用来比对它们之间的差异。

# 1. WebGL 1.0 Uniform

## 1.1. 用 WebGLUniformLocation 寻址

在 WebGL 1.0 中，通常是在 JavaScript 端保存 `WebGLUniformLocation` 以向着色器程序传递 uniform 值的。

使用 `gl.getUniformLocation()` 方法获取这个 location，有如下几种方式

- 全名：`gl.getUniformLocation(program, 'u_someUniformVar')`
- 分量：通常是向量的一部分，譬如 `gl.getUniformLocation(program, 'u_someVec3[0]')` 是获取第 0 个元素（元素类型是 vec3）的 location
- 结构体成员：`gl.getUniformLocation(program, 'u_someStruct.someMember')`

上面三种情况与之对应的着色器代码：

``` glsl
// 全名
uniform float u_someUniformVar;

// 分量
uniform vec3 u_someVec3[3]; // 注意，这里是 3 个 vec3

// 结构体成员
struct SomeStruct {
  bool someMember;
};
uniform SomeStruct u_someStruct;  
```

传值分三类，标量/向量、矩阵、采样纹理，见下文。



## 1.2. 矩阵赋值用 uniformMatrix[234]fv

对于矩阵，使用 `gl.uniformMatrix[234]fv()` 方法即可传递，其中，f 代表 float，v 代表 vector，即传入参数要是一个向量（即数组）；

以传递一个 4×4 的矩阵为例：

``` js
// 获取 location（初始化时）
const matrixLocation = gl.getUniformLocation(program, "u_matrix")

// 创建或更新列主序变换矩阵（渲染时）
const matrix = [/* ... */]

// 传递值（渲染时）
gl.uniformMatrix4fv(matrixLocation, false, matrix)
```



## 1.3. 标量与向量用 uniform\[1234]\[fi]\[v]

对于普通标量和向量，使用 `gl.uniform[1234][fi][v]()` 方法即可传递，其中，1、2、3、4 代表标量或向量的维度（1就是标量啦），f/i 代表 float 或 int，v 代表 vector（即你传递的数据在着色器中将解析为向量数组）。

举例：

- 语句1，`gl.uniform1fv(someFloatLocation, [4.5, 7.1])`
- 语句2，`gl.uniform4i(someIVec4Location, 5, 2, 1, 3)`
- 语句3，`gl.uniform4iv(someIVec4Location, [5, 2, 1, 3, 2, 12, 0, 6])`
- 语句4，`gl.uniform3f (someVec3Location, 7.1, -0.8, 2.1)`

上述 4 个赋值语句对应的着色器中的代码为：

``` glsl
// 语句 1 可以适配 1~N 个浮点数
// 只传单元素数组时，可直接声明 uniform float u_someFloat;
uniform float u_someFloat[2];

// 语句 2 适配一个 ivec4
uniform ivec4 u_someIVec4;

// 语句 3 适配  1~N 个 ivec4
// 只传单元素数组时，可直接声明 uniform float u_someIVec4;
uniform ivec4 u_someIVec4[2];

// 语句 4 适配一个 vec3
uniform vec3 u_someVec3;
```

到了 WebGL 2.0，在组分值类型会有一些扩充，请读者自行查阅相关文档。



## 1.4. 传递纹理

在顶点着色器阶段，可以使用顶点的纹理坐标对纹理进行采样：

``` glsl
attribute vec3 a_pos;
attribute vec2 a_uv;
uniform sampler2D u_texture;
varying vec4 v_color;

void main() {
  v_color = texture2D(u_texture, a_uv);
  gl_Position = a_pos; // 假设顶点不需要变换
}
```

那么，在 JavaScript 端，可以使用 `gl.uniform1i()` 来告诉着色器我把纹理刚刚传递到哪个纹理坑位上了：

```js
const texture = gl.createTexture()
const samplerLocation = gl.getUniformLocation(/* ... */)

// ... 设置纹理数据 ...

gl.activeTexture(gl[`TEXTURE${5}`]) // 告诉 WebGL 使用第 5 个坑上的纹理
gl.bindTexture(gl.TEXTURE_2D, texture)

gl.uniform1i(samplerLocation, 5) // 告诉着色器待会读纹理的时候去第 5 个坑位读
```





# 2. WebGL 2.0 Uniform

## 2.1. 标量/向量/矩阵传值方法扩充

WebGL 2.0 的 Uniform 系统对非方阵类型的矩阵提供了支持，例如

``` js
const mat2x3 = [
  1, 2, 3,
  4, 5, 6,
]
gl.uniformMatrix2x3fv(loc, false, mat2x3)
```

上述方法传递的是 `4×3` 的矩阵。

而对于单值和向量，额外提供了无符号数值的方法，即由 `uniform[1234][fi][v]` 变成了 `uniform[1234][f/ui][v]`，也就是下面 8 个新增方法：

``` js
gl.uniform1ui(/* ... */) // 传递数据至 1 个 uint
gl.uniform2ui(/* ... */) // 传递数据至 1 个 uvec2
gl.uniform3ui(/* ... */) // 传递数据至 1 个 uvec3
gl.uniform4ui(/* ... */) // 传递数据至 1 个 uvec4

gl.uniform1uiv(/* ... */) // 传递数据至 uint 数组
gl.uniform2uiv(/* ... */) // 传递数据至 uvec2 数组
gl.uniform3uiv(/* ... */) // 传递数据至 uvec3 数组
gl.uniform4uiv(/* ... */) // 传递数据至 uvec4 数组
```

对应 GLSL300 中的 uniform 为：

``` glsl
#version 300 es
#define N ? // N 取决于你的需要，JavaScript 传递的数量也要匹配
  
uniform uint u_someUint;
uniform uvec2 u_someUVec2;
uniform uvec3 u_someUVec3;
uniform uvec4 u_someUVec4;

uniform uint u_someUintArr[N];
uniform uvec2 u_someUVec2Arr[N];
uniform uvec3 u_someUVec3Arr[N];
uniform uvec4 u_someUVec4Arr[N];
```

需要额外注意的是，`uint/uvec234` 这些类型在高版本的 glsl 才能使用，也就是说不向下兼容 WebGL 1.0 及 GLSL100.

然而，WebGL 2.0 带来的不单单只是这些小修小补，最重要的莫过于 UBO 了，马上开始。



## 2.1. 什么是 UniformBlock 与 UniformBuffer 的创建

在 WebGL 1.0 的时候，任意种类的统一值一次只能设定一个，如果一帧内 uniform 有较多更新，对于 WebGL 这个状态机来说不是什么好事，会带来额外的 CPU 至 GPU 端的传递开销。

在 WebGL 2.0，允许一次发送一堆 uniform，这一堆 uniform 的聚合体，就叫做 UniformBuffer，具体到代码中：

先是 GLSL 300

```glsl
uniform Light {
  highp vec3 lightWorldPos;
  mediump vec4 lightColor;
};
```

然后是 JavaScript

``` js
const lightUniformBlockBuffer = gl.createBuffer()
const lightUniformBlockData = new Float32Array([
  0, 10, 30, 0,    // vec3, 光源位置, 为了 8 Byte 对齐填充一个尾 0
  1, 1, 1, 1,     // vec4, 光的颜色
])
gl.bindBuffer(gl.UNIFORM_BUFFER, lightUniformBlockBuffer);
gl.bufferData(gl.UNIFORM_BUFFER, lightUniformBlockData, gl.STATIC_DRAW);

gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, lightUniformBlockBuffer)
```

先别急着问为什么，一步一步来。

首先你看到了，在 GLSL300 中允许使用类似结构体一样的块状语法声明多个 Uniform 变量，这里用到了光源的坐标和光源的颜色，分别使用了不同的精度和数据类型（vec3、vec4）。

随后，在 JavaScript 端，你看到了用新增的方法 `gl.bindBufferBase()` 来绑定一个 `WebGLBuffer` 到 0 号位置，这个 `lightUniformBlockBuffer` 其实就是集合了两个 Uniform 变量的 `UniformBufferObject (UBO)`，在着色器中那块被命名为 `Light` 的花括号区域，则叫 `UniformBlock`.

其实，创建一个 `UBO` 和创建普通的 `VBO` 是一样的，绑定、赋值操作也几乎一致（第一个参数有不同）。只不过 UBO 可能更需要考虑数值上的设计，例如 8 字节对齐等，通常会在设计着色器的时候把相同数据类型的 uniform 变量放在一起，达到内存使用上的最佳化。



## 2.2. 状态绑定

在 WebGL 2.0 中，JavaScript 端允许你把着色器程序中的 UniformBlock 位置绑定到某个变量中：

``` js
const viewUniformBufferIndex = 0;
const materialUniformBufferIndex = 1;
const modelUniformBufferIndex = 2;
const lightUniformBufferIndex = 3;
gl.uniformBlockBinding(prg, gl.getUniformBlockIndex(prg, 'View'), viewUniformBufferIndex);
gl.uniformBlockBinding(prg, gl.getUniformBlockIndex(prg, 'Model'), modelUniformBufferIndex);
gl.uniformBlockBinding(prg, gl.getUniformBlockIndex(prg, 'Material'), materialUniformBufferIndex);
gl.uniformBlockBinding(prg, gl.getUniformBlockIndex(prg, 'Light'), lightUniformBufferIndex);
```

这里，使用的是 `gl.getUniformBlockIndex()` 获取 UniformBlock 在着色器程序中的位置，而把这个位置绑定到你喜欢的数字上的是 `gl.uniformBlockBinding()` 方法。

这样做有个好处，你可以在你的程序里人为地规定各个 UniformBlock 的顺序，然后用这些 index 来更新不同的 UBO.

``` js
// 使用不同的 UBO 更新 materialUniformBufferIndex (=1) 指向的 UniformBlock
gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, redMaterialUBO)
gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, greenMaterialUBO)
gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, blueMaterialUBO)
```

当然，WebGL 2.0 对 Uniform 还有别的扩充，此处不再列举。

> bindBufferBase 的作用类似于 enableVertexAttribArray，告诉 WebGL 我马上就要用哪个坑了。



## 2.3. 着色器中的 Uniform

着色器使用 GLSL300 语法才能使用 UniformBlock 和 新的数据类型，除此之外和 GLSL100 没啥区别。当然，GLSL300 有很多新语法，这里只捡一些关于 Uniform 的来写。

关于 `uint/uvec234` 类型，在 2.1 节已经有例子了，这里不赘述。

而关于 UniformBlock，还有一点需要补充的，那就是“命名”问题。

UniformBlock 的语法如下：

``` glsl
uniform <BlockType> {
  <BlockBody>
} ?<blockName>;

// 举例：具名定义
uniform Model {
  mat4 world;
  mat4 worldInverseTranspose;
} model;

// 举例：不具名定义
uniform Light {
  highp vec3 lightWorldPos;
  mediump vec4 lightColor;
};
```

如果使用具名定义，那么访问 Block 内的成员就需要使用它的 name 了，例如 `model.world`、`model.worldInverseTranspose` 等。

举完整的例子如下：

``` glsl
#version 300 es
precision highp float;
precision highp int;

// uniform 块的布局控制
layout(std140, column_major) uniform;

// 声明 uniform 块：Transform，命名为 transform 供主程序使用
// 也可以不命名，就直接用 mvpMatrix 即可
uniform Transform
{
  mat4 mvpMatrix;
} transform;

layout(location = 0) in vec2 pos;

void main() {
  gl_Position = transform.mvpMatrix * vec4(pos, 0.0, 1.0);
}
```

注意，即使给 UniformBlock 命名为 transform，但是立面的 mvpMatrix 是不能与其它 Block 里面的成员共名的，transform 没有命名空间的作用。

再看 JavaScript：

``` js
//#region 获取着色器程序中的 uniform 位置并绑定
const uniformTransformLocation = gl.getUniformBlockIndex(program, 'Transform')
gl.uniformBlockBinding(program, uniformTransformLocation, 0)
//endregion

//#region 创建 ubo
const uniformTransformBuffer = gl.createBuffer()
//#endregion

//#region 创建矩阵所需的 ArrayBufferView，列主序
const transformsMatrix = new Float32Array([
  1.0, 0.0, 0.0, 0.0,
  0.0, 1.0, 0.0, 0.0,
  0.0, 0.0, 1.0, 0.0,
  0.0, 0.0, 0.0, 1.0
])
//#endregion

//#region 传递数据给 WebGLBuffer
gl.bindBuffer(gl.UNIFORM_BUFFER, uniformTransformBuffer)
gl.bufferData(gl.UNIFORM_BUFFER, transformsMatrix, gl.DYNAMIC_DRAW);
gl.bindBuffer(gl.UNIFORM_BUFFER, null)
//#endregion

// ---------- 在你需要绘制时 ----------
//#region 绑定 ubo 到 0 号索引上的 uniformLocation 以供着色器使用
gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uniformTransformBuffer)
// ... 渲染
// -------------
```



## 2.4. 传递纹理

纹理与 WebGL 1.0 一致，但是 GLSL300 的纹理函数有变，读者请自行查找资料比对。



# 3. WebGPU Uniform

WebGPU 有三个类型的 Uniform 资源：标量/向量/矩阵、纹理、采样器。

各自有各自的容器，第一种统一使用 `GPUBuffer`，也就是所谓的 UBO；第二和第三种使用 `GPUTexture` 和 `GPUSampler`.



## 3.1. 三类资源的创建与打组传递

上述三类资源，把它们通过打成一组，也就是 `GPUBindGroup`，我叫它资源绑定组，进而传递给组织了着色器模块（`GPUShaderModule`）的各种管线（`GPURenderPipeline`、`GPUComputePipeline`）。

统一起来好办事，这里为节约篇幅，数据传递就不再细说，着重看看它们的打组成绑定组的代码：

``` js
const someUbo = device.createBuffer({ /* 注意 usage 要有 UNIFORM */ })
const texture = device.createTexture({ /* 创建常规纹理 */ })
const sampler = device.createSampler({ /* 创建常规采样器 */ })

// 布局对象联系管线布局和绑定组本身
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0, // <- 绑定在 0 号资源
      visibility: GPUShaderStage.FRAGMENT,
      sampler: {
        type: 'filtering'
      }
    },
    {
      binding: 1, // <- 绑定在 1 号资源
      visibility: GPUShaderStage.FRAGMENT,
      texture: {
        sampleType: 'float'
      }
    },
    {
      binding: 2,
      visibility: GPUShaderStage.FRAGMENT,
      buffer: {
        type: 'uniform'
      }
    }
  ]
})
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 0,
      resource: sampler, // <- 传入采样器对象
    },
    {
      binding: 1,
      resource: texture.createView() // <- 传入纹理对象的视图
    },
    {
      binding: 2,
      resource: {
        buffer: someUbo // <- 传入 UBO
      }
    }
  ]
})

// 管线
const pipelineLayout = device.createPipelineLayout({
  bindGroupLayouts: [bindGroupLayout]
})
const renderingPipeline = device.createRenderPipeline({
  layout: pipelineLayout
  // ... 其它配置
})

// ... renderPass 切换 pipeline 和 bindGroup 进行绘制 ...
```



## 3.2. 更新 Uniform 与绑定组的意义

更新 Uniform 资源其实很简单。

如果是 UBO，一般会更新前端修改的灯光、材质、时间帧参数以及单帧变化的矩阵等，使用 `device.queue.writeBuffer` 即可：

``` js
device.queue.writeBuffer(
  someUbo, // 传给谁
  0, 
  buffer, // 传递 ArrayBuffer，即当前帧中的新数据
  byteOffset, // 从哪里开始
  byteLength // 取多长
)
```

> 使用 writeBuffer 就可以保证用的还是原来创建那个 GPUBuffer，它与绑定组、管线的绑定关系还在；不用映射、解映射的方式传值是减少 CPU/GPU 双端通信成本

如果是纹理，那就用 [图像拷贝操作](https://www.w3.org/TR/webgpu/#image-copies) 中的几个方法进行纹理对象更新；

一般不直接对采样器和纹理的更新，而是在编码器上切换不同的绑定组来切换管线所需的资源。尤其是纹理，若频繁更新数据，CPU/GPU 双端通信成本会增加的。

延迟渲染、离屏绘制等需要更新颜色附件的，其实只需要创建新的 colorAttachments 对象即可实现“上一帧绘制的下一帧我能用”，不需要直接从 CPU 内存再刷入数据到 GPU 中。

更新 Uniform 需要对每一帧几乎都要改的、几乎不变的资源进行合理分组，分到不同的绑定组中，这样就可以有针对性地更新，而无需把管线、绑定组重设一次，仅仅在通道编码器上进行切换即可。



## 3.3. 着色器中的 Uniform

此处不涉及太多 WGSL 语法。

与 UniformBlock 类似，需要指定“一块东西”，WGSL 直接使用的结构体。

首先，是 UBO：

``` wgls
// -- 顶点着色器 --

// 声明一个结构体类型
struct Uniforms {
  modelViewProjectionMatrix: mat4x4<f32>;
};

// 声明指定其绑定ID是0，绑定组序号是0
@binding(2)
@group(0)
var<uniform> myUniforms: Uniforms;

// —— 然后这个 myUniforms 变量就可以在函数中调用了 ——
```

然后是纹理和采样器：

``` wgsl
@group(0)
@binding(1)
var mySampler: sampler;

@group(0)
@binding(2)
var myTexture: texture_2d<f32>;

// ... 片元着色器主函数中进行纹理采样
textureSample(myTexture, mySampler, fragUV);
```



# 4. 对比总结

WebGL 以 2 为比对基准，它与 WebGPU 相比，没有资源绑定组，没有采样器对象（采样参数通过另外的方法设置）。

比起 WebGPU 的传 descriptor 式的写法，使用一条条方法切换 UniformBlock、纹理等资源可能会有所遗漏，这是全局状态写法的特点之一。当然，上层封装库会帮我们屏蔽这些问题的。

与语法风格相比，其实 WebGPU 改进的更多的是这些 uniform 在每一帧更新时 CPU 到GPU 的负载问题，它是事先由编码器编码成指令缓冲最后一次性发送的，比起 WebGL 一条一条发送是更优的，在图形渲染、GPU运算这种地方，积少成多，性能就高了起来。

关于 WebGL 2.0 的 Uniform 和 GLSL300 我学识不精，若有错误请指出。



# 5. 参考资料

- [WebGL2Fundamentals - StateDiagram - UniformBuffers](https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html?exampleId=uniform-buffers#no-help)

- [Gist - A simple WebGL2 UniformBuffer Tutorial](https://gist.github.com/jialiang/2880d4cc3364df117320e8cb324c2880)

- [CSDN - WebGL2 UniformBlock](https://blog.csdn.net/qq_30621091/article/details/77897333)
- [Austin - WebGPUSamples](https://austin-eng.com/webgpu-samples/)

