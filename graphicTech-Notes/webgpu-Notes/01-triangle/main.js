/*
  2021年9月10日 
*/

const canvas = document.getElementById('gpuweb')
async function render() {
  if (!navigator.gpu) {
    alert('你的浏览器不支持 WebGPU 或未开启 WebGPU 支持')
    return
  }
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  const context = canvas.getContext('webgpu')
  const presentationFormat = context.getPreferredFormat(adapter)
  const devicePixelRatio = window.devicePixelRatio || 1;
  const presentationSize = [
    canvas.clientWidth * devicePixelRatio,
    canvas.clientHeight * devicePixelRatio,
  ]
  context.configure({
    device,
    format: presentationFormat,
    size: presentationSize
  })

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: `
        [[stage(vertex)]]
        fn main([[builtin(vertex_index)]] VertexIndex: u32) 
          -> [[builtin(position)]] vec4<f32> {

          var pos = array<vec2<f32>, 3>(
            vec2<f32>(0.0, 0.5),
            vec2<f32>(-0.5, -0.5),
            vec2<f32>(0.5, -0.5)
          );

          return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        }
        `
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        [[stage(fragment)]]
        fn main() -> [[location(0)]] vec4<f32> {
          return vec4<f32>(1.0, 0.2, 0.4, 1.0);
        }
        `
      }),
      entryPoint: 'main',
      targets: [
        {
          format: presentationFormat
        }
      ]
    },
    primitive: {
      topology: 'triangle-list',
    }
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
        },
        storeOp: 'store'
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