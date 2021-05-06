/*
  2021年5月6日 
*/

const canvas = document.getElementById('gpuweb')
async function render() {
  if (!navigator.gpu) {
    alert('你的浏览器不支持 WebGPU 或未开启 WebGPU 支持')
    return
  }
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  const context = canvas.getContext('gpupresent')
  const swapChainFormat = `bgra8unorm`
  const swapChain = context.configureSwapChain({
    device,
    format: swapChainFormat
  })

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: `
        const pos: array<vec2<f32>, 3> = array<vec2<f32>, 3>(
          vec2<f32>(0.0, 0.5),
          vec2<f32>(-0.5, -0.5),
          vec2<f32>(0.5, -0.5)
        );

        [[builtin(position)]] var<out> Position: vec4<f32>;
        [[builtin(vertex_index)]] var<in> VertexIndex: i32;

        [[stage(vertex)]]
        fn main() -> void {
          Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
          return;
        }
        `
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        [[location(0)]] var<out> outColor: vec4<f32>;

        [[stage(fragment)]]
        fn main() -> void {
          outColor = vec4<f32>(1.0, 0.2, 0.4, 1.0);
          return;
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
    }
  })

  const commandEncoder = device.createCommandEncoder()
  const textureView = swapChain.getCurrentTexture().createView()
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
  passEncoder.draw(3, 1, 0, 0)
  passEncoder.endPass()

  device.queue.submit([commandEncoder.finish()])
}

render()