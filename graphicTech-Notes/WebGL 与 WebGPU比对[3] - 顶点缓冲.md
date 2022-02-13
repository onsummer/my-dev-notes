# 1. WebGL 中的 VBO

## 1.1. 创建 WebGLBuffer

WebGL 使用 TypedArray 进行数据传递，这点 WebGPU 也是一样的。

下面的代码是 WebGL 1.0 常规的 VertexBuffer 创建、赋值、配置过程。

``` js
const positions = [
  0, 0,
  0, 0.5,
  0.7, 0,
]

/*
创建着色器程序 program...
*/

// 获取 vertex attribute 在着色器中的位置
const positionAttributeLocation = gl.getAttribLocation(program, "a_position")

//#region 创建 WebGLBuffer 并绑定，随即写入数据
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
//#endregion

//#region 启用顶点着色器中对应的 attribute，再次绑定数据，并告知 WebGL 如何读取 VertexBuffer
gl.enableVertexAttribArray(positionAttributeLocation)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
//#endregion
```

WebGL 通过 gl 变量的 `createBuffer`、`bindBuffer`、`bufferData` 方法来创建缓冲、绑定当前要用什么缓冲及缓冲的用途、向缓冲传递 CPU 端的 TypedArray 数据并指明绘制模式，通过 gl 变量的 `enableVertexAttribArray`、`vertexAttribPointer` 方法来启用着色器中 attribute 的坑位、告诉着色器如何从 VertexBuffer 中获取顶点数据。



## 1.2. 顶点着色器

一个非常简单的顶点着色器：

``` glsl
precision mediump float;
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 0.0);
}
```

如果用高版本的语法（譬如 WebGL 2.0 中用更高版本的 glsl 语法），你可以这样写：

``` glsl
#version 300 es
precision mediump float;
layout(location = 0) in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 0.0);
}
```



# 2. WebGPU

## 2.1. 创建 GPUBuffer 与传递数据

``` js
const verticesData = [
  // 坐标 xy      // 颜色 RGBA
  -0.5, 0.0,     1.0, 0.0, 0.0, 1.0, // ← 顶点 1
  0.0, 0.5,      0.0, 1.0, 0.0, 1.0, // ← 顶点 2
  0.5, 0.0,      0.0, 0.0, 1.0, 1.0  // ← 顶点 3
])
const verticesBuffer = device.createBuffer({
  size: vbodata.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true // 创建时立刻映射，让 CPU 端能读写数据
})

// 让 GPUBuffer 映射出一块 CPU 端的内存，即 ArrayBuffer，此时这个 Float32Array 仍是空的
const verticesBufferArray = new Float32Array(verticesBuffer.getMappedRange())

// 将数据传入这个 Float32Array
verticesBufferArray.set(verticesData)
// 令 GPUBuffer 解除映射，此时 verticesBufferArray 那块内存才能被 GPU 访问
verticesBuffer.unmap()
```

WebGPU 创建 VertexBuffer 是调取设备对象的 `createBuffer` 方法，返回一个 `GPUBuffer` 对象，它所需要的是指定 GPUBuffer 的类型以及缓冲的大小。如何写入这块缓冲呢？那还要提到“映射”这个概念。

映射简单的说就是让 CPU/GPU 单边访问。此处创建 GPUBuffer 的参数中有一个 `mappedAtCreation` 表示创建时就映射。

> 关于 WebGPU 中 Buffer 的映射、解映射，我有一篇专门的文章介绍，这里不展开过多了。

上面代码中 `verticesBuffer.getMappedRange()` 返回的是一个 ArrayBuffer，随后才进行 set 操作来填充数据。数据填充完毕后，还需要 `unmap` 来解映射，以供后续 GPU 能访问。



## 2.2. 将顶点缓冲的格式信息传递给顶点着色器

顶点着色阶段是 **渲染管线（GPURenderPipeline）** 的一个组成部分，管线需要知道顶点缓冲的数据规格，由着色器模块告知。

创建渲染管线需要 **着色器模块对象（`GPUShaderModule`）**，顶点着色器模块的创建参数就有一个 `buffers` 属性，是一个数组，用于描述顶点着色器中访问到的顶点数据规格：

``` js
const vsShaderModule = device.createShaderModule({
  // ...
  buffers: [
    {
      // 2 个 float32 代表 xy 坐标
      shaderLocation: 0,
      offset: 0,
      format: 'float32x2'
    }, {
      // 4 个 float32 代表 rgba 色值
      shaderLocation: 1,
      offset: 2 * verticesData.BYTES_PER_ELEMENT,
      format: 'float32x4'
    }
  ]
})
```

详细资料可查阅官方 API 文档中关于设备对象的 createShaderModule 方法的要求。



## 2.3. 在渲染通道中设置顶点缓冲

使用 **渲染通道编码器（`GPURenderPassEncoder`）** 来编码单个渲染通道的全流程，其中有一步要设置该通道的顶点缓冲。这个比较简单：

``` js
// ...
renderPassEncoder.setVertexBuffer(0, verticesBuffer)
// ...
```

## 2.4. 顶点着色器

``` wgsl
struct PositionColorInput {
  @location(0) in_position_2d: vec2<f32>;
  @location(1) in_color_rgba: vec4<f32>;
};

struct PositionColorOutput {
  @builtin(position) coords_output: vec4<f32>;
  @location(0) color_output: vec4<f32>;
};

@stage(vertex)
fn main(input: PositionColorInput) 
    -> PositionColorOutput {
  var output: PositionColorOutput;
  output.color_output = input.in_color_rgba;
  output.coords_output = vec4<f32>(input.in_position_2d, 0.0, 1.0);
  return output;
}
```

WGSL 着色器代码可以自定义顶点着色器的入口函数名称、传入参数的结构，也可以自定义向下一阶段输出（即返回值）的结构。

可以看到，为了接收来自 WebGPU API 传递进来的顶点属性，即自定义结构中的 `PositionColorInput` 结构体中的 xy 坐标 `in_position_2d`，以及颜色值 `in_color_rgba`，需要有一个“特性”，叫做 `location`，它括号里的值与着色器模块对象中的 shaderLocation 必须对应上。

而对于输出，代码中则对应了结构体 `PositionColorOutput`，其中向下一阶段（即片段着色阶段）输出用到了内置特性（builtin），叫做 `position`，以及自定义的一个 vec4：color_output，它是片段着色器中光栅化后的颜色，这两个输出，类似 glsl 中的 varying（或者out）作用。



## 2.5. 关于缓冲数据在内存与显存中的申请、传递与销毁

创建 GPUBuffer 的时候，如果没有 `mappedAtCreation: true`，那么内存、显存都没有被申请。

经过代码测试，当执行映射请求且成功映射后，内存就会占用掉对应的 GPUBuffer 的 size，此时完成了 ArrayBuffer 的创建，是要占空间的。

那么什么时候显存会被申请呢？猜测是 `device.queue.commit()` 时，指令缓冲携带着各种通道、各种 Buffer 一并传递给 GPU，执行指令缓冲，希望有高手测试我的猜测。

至于销毁，我使用 `destory` 方法测试 CPU 的内存情况，发现两分钟内并未回收，这一点待测试 ArrayBuffer 的回收情况。



# 3. 比对

`gl.vertexAttribPointer()` 方法的作用类似于 `device.createShaderModule()` 中 `buffers` 的作用，告诉着色器顶点缓冲单个顶点的数据规格。

`gl.createBuffer()` 和 `device.createBuffer()` 是类似的，都是创建一个 CPU 端内存中的 Buffer 对象，但实际并没有传入数据。

数据传递则不大一致了，WebGL 同一时刻只能指定一个 VertexBuffer，所以 `gl.bindBuffer()`、`gl.bufferData()` 一系列函数调用下来都沿着逻辑走；而 WebGPU 则需要经过映射和解映射。

在 WebGPU 中最重要的是，在 renderPassEncoder 记录发出 draw 指令之前，要调用 `renderPassEncoder.setVertexBuffer()` 方法显式指定用哪一个 VertexBuffer。

着色器代码请读者自行比对研究，只是语法上的差异。



# 4. VertexArrayObject

VAO 我也写过一篇《WebGPU 中消失的 VAO》，这里就不详细展开了，有兴趣的读者请移步我的博客列表找找。

WebGPU 中已经不需要 VAO 了，源于 WebGPU 的机制与 WebGL 不同，VAO 本身是 OpenGL 体系提出的概念，它能节约 WebGL 切换顶点相关状态时的负担，也就是帮你缓存下来一个 VBO 的设定状态，而无需再 `gl.bindBuffer()`、`gl.bufferData()`、`gl.vertexAttribPointer()` 等再来一遍。

WebGPU 的装配式思想天然就与 VAO 是一致的。VAO 的职能转交给 `GPURenderPipeline` 完成，其创建参数 `GPURenderPipelineDescriptor.vertex.buffers` 属性是 `GPUVertexBufferLayout[]` 类型的，这每一个 `GPUVertexBufferLayout` 对象就有一部分 VAO 的职能。

