一个字符串枚举

``` web-idl
enum GPUVertexStepMode {
  "vertex",
  "instance"
};
```

# 例子 1

不妨看一段数据：

``` js
const data = new Float32Array([
  position_x_1, position_y_1, 
  velocity_x_1, velocity_y_1,
  
  position_x_1, position_y_1, 
  velocity_x_1, velocity_y_1,
  
  // ...
])
```

然后看看它的渲染管线布置：

``` js
const renderPipeline = device.createRenderPipeline({
  vertex: {
    buffers: [
      {
        arrayStride: 4 * 4,
        stepMode: "instance", // ← GPUVertexStepMode
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: "float32x2"
          },
          {
            shaderLocation: 1,
            offset: 2 * 4,
            format: "float32x2"
          }
        ]
      },
      {
        /* another GPUBuffer layout */
      }
    ],
    /* ... */
  },
  /* ... */
})
```

再看看着色器：

``` wgsl
[[stage(vertex)]]
fn main(
  [[location(0)]] particle_position: vec2<f32>,
  [[location(1)]] particle_velocity: vec2<f32>,
  [[location(2)]] position: vec2<f32>
) -> [[builtin(position)]] vec4<f32> {
  // ... return a vec4<f32>.
}
```

看看绘制

``` js
passEncoder.draw(3, numParticles, 0, 0); // numParticles 是粒子数 要绘制这么多次
```



# 例子 2

数据

``` js
new Float32Array(vertexBuffer.getMappedRange()).set([
  // position data // color data
  0, 0.1, 0, 1,   1,0,0,1,
  -0.1,-0.1,0,1,  0,1,0,1,
  0.1,-0.1,0,1,   0,0,1,1
])
```

管线

``` js
const renderPipeline = device.createRenderPipeline({
  vertex: {
    buffers: [
      {
        arrayStride: 2 * 4 * 4,
        stepMode: "vertex",
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: "float32x4",
          },
          {
            shaderLocation: 1,
            offset: 4 * 4,
            format: "float32x4"
          }
        ]
      }
    ]
  }
})
```

着色器

``` wgsl
[[stage(vertex)]]
fn main(
	[[location(0)]] position: vec4<f32>,
	[[location(1)]] color: vec4<f32>
) -> VertexOutput {
	// return a struct of VertexOutput.
}
```

看看绘制

``` js
passEncoder.draw(3, 1, 0, 0)
```





所以得出结论：无论是 "instance" 还是 "vertex"，VertexBuffer 中数据的排列均为逐顶点数据排列，每个顶点数据又包括自己的N个顶点属性。

# "instance"

当 `passEncoder.draw(vertexCount, instanceCount, 0, 0)` 的第二个参数大于 1 时，pipeline.vertex.buffers[i] 的 stepMode 属性要是 `"instance"`。

"instance" 模式，表示即使渲染通道编码器发出绘制多次（draw 方法的 instanceCount 参数大于 1）的指令，在绘制完第一轮后（顶点着色器跑了一遍后），仍然从同一个 VertexBuffer 的起点开始获取顶点数据

# "vertex"

"vertex" 模式，表示无论渲染通道编码器发出几次绘制（draw 方法的 instanceCount 参数无论是几）指令，都不会从 VertexBuffer 的头部再重新开始读取顶点数据，而是基于第一次读取的末尾继续往下读