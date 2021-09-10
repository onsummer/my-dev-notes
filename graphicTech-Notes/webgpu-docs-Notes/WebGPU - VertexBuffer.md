wgsl 中现在使用结构体作为输入输出

``` wgsl
// vs

struct PositionColorInput {
  [[location(0)]] in_position_2d: vec2<f32>;
  [[location(1)]] in_color_rgba: vec4<f32>;
};

struct PositionColorOutput {
  [[builtin(position)]] coords_output: vec4<f32>;
  [[location(0)]] color_output: vec4<f32>;
};

// main 的输入参数除了结构体，还可以是简单的多个参数，例如
// fn main([[location(0)]] in_position_2d: vec2<f32>, [[location(1)]] in_color_rgba: vec4<f32>) { /* ... */ }
// 但是输出只能是单值，此处要向下一个阶段输出 vbo 中的颜色 attribute，只能使用结构体

[[stage(vertex)]]
fn main(input: PositionColorInput) 
	-> PositionColorOutput {
  var output: PositionColorOutput;
  output.color_output = input.in_color_rgba;
  output.coords_output = vec4<f32>(input.in_position_2d, 0.0, 1.0);
  return output;
}
```

webgpu 端的js代码：

``` js
const vbodata = new Float32Array([
  -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
  0.0, 0.5, 0.0, 1.0, 0.0, 1.0,
  0.5, 0.0, 0.0, 0.0, 1.0, 1.0
])
const vbo = device.createBuffer({
  size: vbodata.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true
})
new Float32Array(vbo.getMappedRange()).set(vbodata)
vbo.unmap()

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

// ...
passEncoder.setVertexBuffer(0, vbo)
// ...
```

