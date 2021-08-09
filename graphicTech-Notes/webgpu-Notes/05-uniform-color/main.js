/*
  2021年5月6日 
*/

const canvas = document.getElementById('gpuweb')
const vbodata = new Float32Array([
  -0.5, 0.0, 
  0.0, 0.5,
  0.5, 0.0,
])

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

  const vbo = device.createBuffer({
    size: vbodata.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  })
  new Float32Array(vbo.getMappedRange()).set(vbodata)
  vbo.unmap()

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        /* use for matrix */
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {
          type: 'uniform'
        }
      }
    ]
  })
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  })

  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: device.createShaderModule({
        code: `
        [[builtin(position)]] var<out> out_position: vec4<f32>;
        [[location(0)]] var<in> in_position_2d: vec2<f32>;

        [[stage(vertex)]]
        fn main() -> void {
          out_position = vec4<f32>(in_position_2d, 0.0, 1.0);
          return;
        }
        `
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 2 * vbodata.BYTES_PER_ELEMENT,
        attributes: [{
          shaderLocation: 0,
          offset: 0,
          format: 'float32x2'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        [[block]] struct Uniforms {
          uniform_color: vec4<f32>;
        };
        [[binding(0), group(0)]] var<uniform> uniforms: Uniforms;
        [[location(0)]] var<out> outColor: vec4<f32>;

        [[stage(fragment)]]
        fn main() -> void {
          outColor = uniforms.uniform_color; // <- 从 uniform 里取一个颜色值
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
    },
  })

  /* create uniform buffer */
  const uniformBufferSize = 4 * 4 // vec4<f32>
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  const uniformBindGroup = device.createBindGroup({
    layout: bindGroupLayout, // <- 直接传递 绑定组布局对象 也可以
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      }
    ]
  })
  const uniformColor = new Float32Array([0.0, 0.5, 0.0, 1.0])
  device.queue.writeBuffer(uniformBuffer, 0, uniformColor.buffer, uniformColor.byteOffset, uniformColor.byteLength)

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
  passEncoder.setBindGroup(0, uniformBindGroup)
  passEncoder.setVertexBuffer(0, vbo)
  passEncoder.draw(3, 1, 0, 0)
  passEncoder.endPass()

  device.queue.submit([commandEncoder.finish()])
}

render()