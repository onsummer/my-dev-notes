/*
  2021年9月10日 
*/

const canvas = document.getElementById('gpuweb')
const vbodata = new Float32Array([
  -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
  0.0, 0.5, 0.0, 1.0, 0.0, 1.0,
  0.5, 0.0, 0.0, 0.0, 1.0, 1.0
])

async function render() {
  if (!navigator.gpu) {
    alert('你的浏览器不支持 WebGPU 或未开启 WebGPU 支持')
    return
  }
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  const context = canvas.getContext('webgpu')
  const swapChainFormat = `bgra8unorm`
  context.configure({
    device,
    format: swapChainFormat
  })

  const vbo = device.createBuffer({
    size: vbodata.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  })
  new Float32Array(vbo.getMappedRange()).set(vbodata)
  vbo.unmap()

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: `
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
        `
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 6 * vbodata.BYTES_PER_ELEMENT,
        attributes: [{
          shaderLocation: 0,
          offset: 0,
          format: 'float32x2'
        }, {
          shaderLocation: 1,
          offset: 2 * vbodata.BYTES_PER_ELEMENT,
          format: 'float32x4'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        [[stage(fragment)]]
        fn main([[location(0)]] in_color: vec4<f32>) 
          -> [[location(0)]] vec4<f32> {
          return in_color;
        }
        `
      }),
      entryPoint: 'main',
      targets: [
        {
          format: swapChainFormat
        }
      ]
    },
    primitive: {
      topology: 'triangle-list',
    },
  })

  const commandEncoder = device.createCommandEncoder()
  const textureView = context.getCurrentTexture().createView()
  const renderPassDescriptor = {
    colorAttachments: [
      {
        view: textureView,
        loadValue: {
          r: 0.0,
          g: 0.0,
          b: 0.0,
          a: 1.0
        }
      }
    ]
  }

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
  passEncoder.setPipeline(pipeline)
  passEncoder.setVertexBuffer(0, vbo)
  passEncoder.draw(3, 1, 0, 0)
  passEncoder.endPass()

  device.queue.submit([commandEncoder.finish()])
}

render()