# VertexBuffer 的创建

VertexBuffer 的本体就是一个 `GPUBuffer`，主要就是指定其 usage，以及在创建 ShaderModule 时配置好 VertexAttribute，上代码：

``` js
const vbodata = new Float32Array([
  -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
  0.0, 0.5, 0.0, 1.0, 0.0, 1.0,
  0.5, 0.0, 0.0, 0.0, 1.0, 1.0
])
const vbo = device.createBuffer({
  size: vbodata.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true // 创建时立刻映射，让 CPU 端能读写数据
})

// 实例化一个新的 Float32Array，并获取 GPUBuffer 的映射范围，传入上面的数据，这样 ArrayBuffer 就有值了
new Float32Array(vbo.getMappedRange()).set(vbodata)
vbo.unmap() // 一定要解除映射，GPU 才能读写

// ...

const vsShaderModule = device.createShaderModule({
  code: vsSource,
  entryPoint: 'main',
  buffers: [
    {
      shaderLocation: 0,
      offset: 0,
      format: 'float32x2'
    }, {
      shaderLocation: 1,
      offset: 2 * vbodata.BYTES_PER_ELEMENT,
      format: 'float32x4'
    }
  ]
})
```

## WGSL 端接受输入

与 GLSL 略有不同，当新语法学习即可。

WGLS 中现在使用结构体作为输入输出。

``` wgsl
/* 顶点着色器阶段 */

struct PositionColorInput {
  [[location(0)]] in_position_2d: vec2<f32>;
  [[location(1)]] in_color_rgba: vec4<f32>;
};

struct PositionColorOutput {
  [[builtin(position)]] coords_output: vec4<f32>;
  [[location(0)]] color_output: vec4<f32>;
};

/* 

	main 的输入参数除了结构体，还可以是简单的多个参数，例如
	
	fn main(
	  [[location(0)]] in_position_2d: vec2<f32>, 
	  [[location(1)]] in_color_rgba: vec4<f32>) -> PositionColorOutput { 
	  /* ... */ 
	}
 但是 WGSL 函数规定输出只能是单值
 本例要向下一个阶段（片元着色器阶段）输出 vbo 中的 colorAttribute，只能使用结构体
 
*/

[[stage(vertex)]]
fn main(input: PositionColorInput) 
	-> PositionColorOutput {
  var output: PositionColorOutput;
  output.color_output = input.in_color_rgba;
  output.coords_output = vec4<f32>(input.in_position_2d, 0.0, 1.0);
  return output;
}
```

# VertexBuffer 的数据传入

向 VBO 传递数据，需要用到取消映射的 GPUBuffer 和 TypedArray 数组，其主要接口是 渲染通道编码器的 `setVertexBuffer()` 方法。

参考代码：

``` js
// ...
passEncoder.setVertexBuffer(0, vbo)
// ...
```

