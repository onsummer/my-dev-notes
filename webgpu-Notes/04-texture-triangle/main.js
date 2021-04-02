/*
  2021年4月2日 
*/

const canvas = document.getElementById('gpuweb')
const vbodata = new Float32Array([
  -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
  0.0, 0.5, 0.0, 1.0, 0.0, 1.0,
  0.5, 0.0, 0.0, 0.0, 1.0, 1.0
])

// --- create texture data --- //
const textureCanvas = document.createElement('canvas')
const textureCanvasCtx = textureCanvas.getContext('2d')
const img = document.createElement('img')
img.src = "texture.png"
textureCanvas.width = img.width
textureCanvas.height = img.height
textureCanvasCtx.drawImage(img, 0, 0)
const textureBuffer = textureCanvasCtx.getImageData(0, 0, img.width, img.height).data
// --- end --- //

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

  // --- create sampler --- //
  const sampler = device.createSampler({
    minFilter: "linear",
    magFilter: "linear"
  })
  // --- end --- //
  // --- create texture --- //
  const texture = device.createTexture({
    size: [img.width, img.height], // 256, 256
    format: "rgba8unorm",
    usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST
  })
  // --- end --- //

  // --- flash texture buffer to gpu --- //
  // console.log(device.queue.writeTexture)
  device.queue.writeTexture(
    { texture },
    textureBuffer,
    { bytesPerRow: img.width * 4 }, // rgba
    [
      img.width, img.height, 1
    ]
  )
  // --- end --- //

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
        [[builtin(position)]] var<out> out_position: vec4<f32>;
        [[location(0)]] var<out> out_color: vec4<f32>;
        [[location(0)]] var<in> in_position_2d: vec2<f32>;
        [[location(1)]] var<in> in_color_rgba: vec4<f32>;
        [[stage(vertex)]]
        fn main() -> void {
          out_position = vec4<f32>(in_position_2d, 0.0, 1.0);
          out_color = in_color_rgba;
          return;
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
        [[location(0)]] var<out> outColor: vec4<f32>;
        [[location(0)]] var<in> in_color: vec4<f32>;
        [[stage(fragment)]]
        fn main() -> void {
          outColor = in_color;
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

  const commandEncoder = device.createCommandEncoder()
  const textureView = swapChain.getCurrentTexture().createView()
  const renderPassDescriptor = {
    colorAttachments: [
      {
        attachment: textureView,
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