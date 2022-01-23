# 1. VertexBuffer

## 1.1 WebGL

### 1.1.1 WebGL API 常见创建 WebGLBuffer 的过程

WebGL 使用 TypedArray 进行数据传递，这点 WebGPU 也是一样的。

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

/* 创建 WebGLBuffer */
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

gl.enableVertexAttribArray(positionAttributeLocation)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
/* end */
```

WebGL 通过 gl 变量的 createBuffer、bindBuffer、bufferData 方法来创建缓冲、绑定当前要用什么缓冲及缓冲的用途、向缓冲传递 CPU 端的 TypedArray 数据并指明绘制模式，通过 gl 变量的 enableVertexAttribArray、vertexAttribPointer 方法来启用着色器中 attribute 的坑位、告诉着色器如何从 VertexBuffer 中获取顶点数据。

### 1.1.2 着色器代码中接收顶点属性

一个非常简单的顶点着色器：

``` glsl
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 0.0);
}
```





## 1.2 WebGPU

### 1.2.1 GPUBuffer 的创建与数据输入

WebGPU 中的 VertexBuffer 的创建其实我在 [WebGPU 补充篇之 VertexBuffer](https://zhuanlan.zhihu.com/p/412694412) 讲得比较详细了，这里主要是贴个代码。

``` js
const verticesData = new Float32Array([
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

观察到，WebGPU 创建 VertexBuffer 是调取设备对象的 `createBuffer` 方法，返回一个 `GPUBuffer` 对象，它所需要的是指定 GPUBuffer 的类型以及缓冲的大小。如何写入这块缓冲呢？那还要提到“映射”这个概念。

映射简单的说就是让 CPU/GPU 单边访问。此处创建 GPUBuffer 的参数中有一个 `mappedAtCreation` 表示创建时就映射。

上面代码中 `verticesBuffer.getMappedRange()` 返回的是一个 ArrayBuffer，随后才进行 set Float32Array 这个操作。数据填充完毕后，还需要 `unmap` 来解除 CPU 端的映射。

### 1.2.2 将顶点缓冲的格式信息传递给顶点着色器

顶点着色阶段是渲染管线的一个组分，它需要知道顶点缓冲的字节排布。

而创建渲染管线则需要着色器模块，顶点着色器模块的创建参数就有一个 `buffers` 字段，用于描述缓冲的样子：

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

不详细展开了，有需要了解的可查阅官方 API 文档中关于设备对象的 createShaderModule 方法的要求。



### 1.2.3 在渲染通道中设置顶点缓冲

渲染通道使用渲染通道编码器来起草单个通道的渲染流程，其中有一步要设置该通道的顶点缓冲。这个比较简单：

``` js
// ...
passEncoder.setVertexBuffer(0, vbo)
// ...
```

### 1.2.4 着色器代码中接收顶点属性

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

WGSL 可以自定义顶点着色器代码的入口函数名称，可以自定义传入参数的结构，也可以自定义向下一阶段输出（即返回值）的结构。

可以看到，为了接收来自 WebGPU API 传递进来的顶点属性，即自定义结构中的 `PositionColorInput` 结构体中的 xy 坐标 `in_position_2d`，以及颜色值 `in_color_rgba`，需要有一个“特性”，叫做 `location`，它括号里的值与着色器模块对象中的 shaderLocation 必须对应上。

而对于输出，代码中则对应了结构体 `PositionColorOutput`，其中向下一阶段（即片段着色阶段）输出用到了内置特性，叫做 `position`，以及自定义的一个 vec4：color_output，它是片段着色器中光栅化后的颜色，这两个输出，类似 glsl 中的 varying 作用。



## 1.3 比对

gl.vertexAttribPointer 方法的作用类似于 createShaderModule 中 `buffers` 的作用，告诉着色器如何取值。

gl.createBuffer 和 device.createBuffer 是类似的，都是创建一个 CPU 端内存中的 Buffer 对象，但实际并没有传入数据。

数据传递则不大一致了，WebGL 一次绘制只能指定一次 VertexBuffer，所以 bindBuffer、bufferData 一系列函数调用下来都沿着逻辑走；而 WebGPU 的数据传递则需要经过映射和解映射。

最重要的是，在 renderPassEncoder 发出 draw 指令之前，还要调用 `setVertexBuffer`  函数显式指定用哪一个 VertexBuffer。

着色器和着色器代码就不细说了。



# 2. Vertex Array Object
