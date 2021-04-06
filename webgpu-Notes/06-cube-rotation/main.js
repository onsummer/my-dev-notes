const cube_vbo = new Float32Array([
  
])
const projectMatrix = undefined

/**
 * @description 
 *   返回一个 Float32Array，长度为 16，表示一个列优先的矩阵
 */
function computeMatrix() {
  /* 
    因为 cube 本身的模型坐标系当作世界坐标系，
    所以 model 矩阵即单位矩阵，即不变换，
    直接下一步 view 矩阵 
  */
  
  /* 计算 view 矩阵 */
  
  /* 返回 model-view-project 矩阵 */
  
}

async function render() {
  if (!navigator.gpu) {
    alert('你的浏览器不支持 WebGPU 或未开启 WebGPU 支持')
    return
  }
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter

  /* 获取 context、交换链 */
  const context = canvas.getContext('gpupresent')
  const swapChainFormat = 'bgra8unorm'
  const swapChain = context.configureSwapChain({
    device,
    format: swapChainFormat,
  })

  /* 创建 GPUBuffer：vbo、uniformBuffer、深度缓存 */
  const vbo = device.createBuffer({
    size: cube_vbo.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  })
  new Float32Array(vbo.getMappedRange()).set(cube_vbo)
  vbo.unmap()
  const uniformBuffer = device.createBuffer({
    size: 4 * 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  
  /* 创建深度纹理 */
  const depthTexture = device.createTexture({
    size: {
      width: canvas.width,
      height: canvas.height,
    },
    format: 'depth24plus-stencil8',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  })
  
  /* 创建 pipeline布局、绑定组布局、绑定组 */
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
    bindGroupLayouts: [bindGroupLayout],
  })
  const uniformBindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      }
    ]
  })
    
  /* 创建 pipeline */
  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: device.createShaderModule({
        code: `
        [[block]] struct Uniforms {
          matrix: mat4x4;
        }
        [[binding(0), group(0)]] var<uniform> uniforms: Uniforms;
        [[builtin(position)]] var<out> out_position: vec4<f32>;
        [[location(0)]] var<in> in_position_3d: vec3<f32>;
        
        [[stage(vertex)]]
        fn main() -> void {
          out_position = uniforms.matrix * vec4<f32>(in_position_3d, 1.0);
          return;
        }
        `
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 0,
        attributes: [{
          // position
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        [[location(0)]] var<out> outColor: vec4<f32>;
        
        [[stage(fragment)]]
        fn main() -> void {
          outColor = vec4<f32>(0.2, 0.0, 0.4, 1.0);
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
      cullMode: 'back', // <- 开启背面剔除
    },
    /* NEW: 深度阶段 */
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus-stencil8',
    }
  })
  
  /* 帧：创建 命令编码器、渲染通道编码器 */
  const renderPassDescriptor = {
    colorAttachments: [
      {
        attachment: undefined,
        loadValue: {
          r: 0.0,
          g: 0.0,
          b: 0.0,
          a: 1.0
        }
      }
    ],
    /* NEW: 深度与模板附件 */
    depthStencilAttachment: {
      attachment: depthTexture.createView(),
      depthLoadValue: 1.0,
      depthStoreOp: 'store',
      stencilLoadValue: 0,
      stencilStoreOp: 'store',
    }
  }
  function requestNewFrame() {
    /* 计算新的矩阵并传入 */
    const matrix = computeMatrix()
    device.queue.writeBuffer(uniformBuffer, 0, matrix.buffer, matrix.byteOffset, matrix.byteLength)
    
    const commandEncoder = device.createCommandEncoder()
    const textureView = swapChain.getCurrentTexture().createView()
    renderPassDescriptor.colorAttachments[0].attachment = textureView
        
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, uniformBindGroup)
    passEncoder.setVertexBuffer(0, vbo)
    passEncoder.draw(36, 1, 0, 0) // draw 36 vertices, once.
    passEncoder.endPass()
    
    device.queue.submit([commandEncoder.finish()])
    
    requestAnimationFrame(requestNewFrame)
  }
  
  return requestNewFrame()
}

render().then(f => f())