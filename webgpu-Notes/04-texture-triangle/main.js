/*
  2021年5月6日 
*/

const canvas = document.getElementById('gpuweb')
const vbodata = new Float32Array([
  -1.0, -1.0, 0.0, 1.0,
  0.0, 1.0, 0.5, 0.0,
  1.0, -1.0, 1.0, 1.0
])

// --- create texture data --- //
// const textureCanvas = document.createElement('canvas')
// const textureCanvasCtx = textureCanvas.getContext('2d')

// textureCanvas.width = img.width
// textureCanvas.height = img.height
// textureCanvasCtx.drawImage(img, 0, 0)
// const textureBuffer = textureCanvasCtx.getImageData(0, 0, img.width, img.height).data
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

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        /* use for sampler */
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {
          type: 'filtering',
        },
      },
      {
        /* use for texture view */
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: 'float'
        }
      }
    ]
  })
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  })
  
  // --- create sampler --- //
  const sampler = device.createSampler({
    minFilter: "linear",
    magFilter: "linear"
  })
  // --- end --- //

  const img = document.createElement('img')
  img.src = 'texture.webp'
  await img.decode()
  const imageBitmap = await createImageBitmap(img)
  // --- create texture --- //
  const texture = device.createTexture({
    size: [img.width, img.height], // 256, 256
    format: "rgba8unorm",
    usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST
  })
  // --- end --- //

  // --- flash texture buffer to gpu --- //
  // device.queue.writeTexture(
  //   { texture },
  //   imageBitmap,
  //   { bytesPerRow: img.width * 4 }, // rgba
  //   [
  //     img.width, img.height, 1
  //   ]
  // )

  device.queue.copyImageBitmapToTexture({
    imageBitmap: imageBitmap
  }, {
    texture: texture
  }, [img.width, img.height, 1])
  // --- end --- //

  const vbo = device.createBuffer({
    size: vbodata.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  })
  new Float32Array(vbo.getMappedRange()).set(vbodata)
  vbo.unmap()

  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: device.createShaderModule({
        code: `
        [[builtin(position)]] var<out> out_position: vec4<f32>;
        [[location(0)]] var<out> out_st: vec2<f32>;

        [[location(0)]] var<in> in_position_2d: vec2<f32>;
        [[location(1)]] var<in> in_st: vec2<f32>;
        
        [[stage(vertex)]]
        fn vertex_main() -> void {
          out_position = vec4<f32>(in_position_2d, 0.0, 1.0);
          out_st = in_st;
          return;
        }
        `
      }),
      entryPoint: 'vertex_main',
      buffers: [{
        arrayStride: 4 * vbodata.BYTES_PER_ELEMENT,
        attributes: [{
          // position
          shaderLocation: 0,
          offset: 0,
          format: 'float32x2'
        }, {
          // uv0
          shaderLocation: 1,
          offset: 2 * vbodata.BYTES_PER_ELEMENT,
          format: 'float32x2'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        [[binding(0), group(0)]] var mySampler: sampler;
        [[binding(1), group(0)]] var myTexture: texture_2d<f32>;

        [[location(0)]] var<out> outColor: vec4<f32>;
        
        [[location(0)]] var<in> in_st: vec2<f32>;
        
        [[stage(fragment)]]
        fn frag_main() -> void {
          outColor = textureSample(myTexture, mySampler, in_st);
          return;
        }
        `
      }),
      entryPoint: 'frag_main',
      targets: [
        {
          format: swapChainFormat
        }
      ]
    },
    primitive: {
      topology: 'triangle-list',
      // cullMode: 'back',
    },
  })
  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: sampler,
      },
      {
        binding: 1,
        resource: texture.createView()
      }
    ]
  })

  return function requestNewFrame() {
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

    // requestAnimationFrame(requestNewFrame)
  }
}

render().then(requestNewFrame => requestNewFrame())