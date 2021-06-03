const glMat = glMatrix['glMatrix']
const { mat4, vec3 } = glMatrix
const { toRadian } = glMat
let deg = 0.5
let transformMatrix = mat4.create()
transformMatrix = mat4.scale(transformMatrix, transformMatrix, vec3.fromValues(0.5, 0.5, 0.5))
transformMatrix = mat4.rotateX(transformMatrix, transformMatrix, toRadian(30))
transformMatrix = mat4.rotateY(transformMatrix, transformMatrix, toRadian(45))
const canvas = document.getElementById('gpuweb')

async function getData() {
  const response = await fetch('/cube.vbo.bin')
  const buffer = await response.arrayBuffer()
  return buffer
}

async function main() {
  if (!navigator.gpu) {
    alert('你的浏览器不支持 WebGPU 或未开启 WebGPU 支持')
    return
  }
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  /* 获取 context、交换链 */
  const context = canvas.getContext('gpupresent')
  const swapChainFormat = 'bgra8unorm'
  const swapChain = context.configureSwapChain({
    device,
    format: swapChainFormat,
  })

  /* -- 创建 GPUBuffer：vbo、uniformBuffer、深度缓存 -- */
  const vertexBufferData = new Float32Array(await getData())
  const vertexBuffer = device.createBuffer({
    size: vertexBufferData.byteLength,
    usage: GPUBufferUsage.VERTEX, // 用途：顶点数据
    mappedAtCreation: true,
  })
  new Float32Array(vertexBuffer.getMappedRange()).set(vertexBufferData)
  vertexBuffer.unmap()
  const uniformBuffer = device.createBuffer({
    size: 4 * 16, // 4 byte * 16 component = 64 byte 一个矩阵
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  /* -- gpubuffer 创建完毕 -- */

  let cubeTexture;
  {
    const img = document.createElement('img');
    img.src = '/world.webp';
    await img.decode();
    const imageBitmap = await createImageBitmap(img);

    cubeTexture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST,
    });
    device.queue.copyImageBitmapToTexture(
      { imageBitmap },
      { texture: cubeTexture },
      [imageBitmap.width, imageBitmap.height, 1]
    );
  }

  /* -- 创建采样器 -- */
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  })
  /* -- 结束创建 -- */

  /* 创建深度与模板纹理 */
  const depthTexture = device.createTexture({
    size: {
      width: canvas.width,
      height: canvas.height,
    },
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT, // 用途：渲染附件
  })
  /* -- 深度与模板纹理创建完毕 -- */

  /* 创建 绑定组布局、pipeline布局、uniform数据绑定组 */
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        /* use for matrix */
        binding: 0,
        visibility: GPUShaderStage.VERTEX, // 给顶点着色器阶段使用
        buffer: {
          type: 'uniform'
        }
      },
      {
        // 采样器
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {
          // 空对象即可，全部使用默认值
          // type: 'filtering'
        }
      },
      {
        // 纹理贴图
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { 
          // 空对象即可，全部使用默认值
          // sampleType: 'float',
          // viewDimension: '2d',
          // multisampled: false
        }
      }
    ]
  })
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  })
  const uniformBindGroup = device.createBindGroup({
    layout: bindGroupLayout, // bindGroup 一端绑定数据布局（即bindGroupLayout）
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer // 另一端连接 GPUBuffer（uniform）
        }
      },
      {
        binding: 1,
        resource: sampler
      },
      {
        binding: 2,
        resource: cubeTexture.createView()
      }
    ]
  })

  /* -- 创建 pipeline -- */
  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: device.createShaderModule({
        code: `
        // 声明结构体类型 Uniforms，内含变量 matrix
        [[block]] struct Uniforms {
          matrix: mat4x4<f32>;
        };
        // 声明结构体，并用 binding 和 group 分别指定第 0 个资源值（即entries[0].binding），和第 0 个组（即entries[0]）
        [[binding(0), group(0)]] var<uniform> uniforms: Uniforms;

        [[builtin(position)]] var<out> out_position: vec4<f32>;
        [[location(0)]] var<out> out_position_uv: vec2<f32>;

        [[location(0)]] var<in> in_position_3d: vec3<f32>;
        [[location(1)]] var<in> in_position_uv: vec2<f32>;
        
        [[stage(vertex)]]
        fn main() -> void {
          out_position = uniforms.matrix * vec4<f32>(in_position_3d, 1.0);
          out_position_uv = in_position_uv;
          return;
        }
        `
      }),
      entryPoint: 'main',
      buffers: [{
        arrayStride: 5 * vertexBufferData.BYTES_PER_ELEMENT, // 5个数字为一个 vertexAttr
        attributes: [{
          // 第一个 vertexAttr：position，顶点着色器的靶向位置是 0，起始偏移量是 0，格式为 3个32位浮点数
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3'
        }, {
          // 第二个 vertexAttr：uv0，本例暂未用到，顶点着色器的靶向位置是 1，起始偏移量是 3*4byte，格式为 2个32位浮点数
          shaderLocation: 1,
          offset: 3 * vertexBufferData.BYTES_PER_ELEMENT,
          format: 'float32x2'
        }]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: `
        [[binding(1), group(0)]] var my_sampler: sampler;
        [[binding(2), group(0)]] var my_texture: texture_2d<f32>;
        
        [[location(0)]] var<out> outColor: vec4<f32>;

        [[location(0)]] var<in> in_position_uv: vec2<f32>; // in 和 out 的变量的 location 编号是独立的
        
        [[stage(fragment)]]
        fn main() -> void {
          outColor = textureSample(my_texture, my_sampler, in_position_uv);
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
      format: 'depth24plus',
    }
  })

  /* 帧：创建 渲染通道描述对象，设定两个重要附件（颜色附件和深度模板附件）的参数 */
  const renderPassDescriptor = {
    colorAttachments: [
      {
        view: undefined,
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
      view: depthTexture.createView(),
      depthLoadValue: 1.0,
      depthStoreOp: 'store',
      stencilLoadValue: 0,
      stencilStoreOp: 'store',
    }
  }

  /* 返回一个渲染函数，通过调用它，就可以渲染每一帧了 */
  function render() {
    /* -- 每一帧首先写入要动的：矩阵 -- */
    transformMatrix = mat4.rotateY(transformMatrix, transformMatrix, toRadian(deg))
    // transformMatrix = mat4.rotateX(transformMatrix, transformMatrix, toRadian(0.5 * deg))

    device.queue.writeBuffer(uniformBuffer, 0, transformMatrix.buffer, transformMatrix.byteOffset, transformMatrix.byteLength)

    /* -- 把交换链中当前帧的颜色纹理赋予到渲染通道描述对象的颜色附件上 -- */
    const textureView = swapChain.getCurrentTexture().createView()
    renderPassDescriptor.colorAttachments[0].view = textureView

    /* -- 随后，创建命令编码器 -- */
    const commandEncoder = device.createCommandEncoder()
    /* -- 根据变动后的 渲染通道描述对象 重新创建通道编码器，并依次设定渲染管线、uniform绑定组、顶点缓存，并执行绘制命令，结束 -- */
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, uniformBindGroup)
    passEncoder.setVertexBuffer(0, vertexBuffer)
    passEncoder.draw(36, 1, 0, 0) // draw 36 vertices, once.
    passEncoder.endPass()

    device.queue.submit([commandEncoder.finish()])

    requestAnimationFrame(render)
  }

  return render
}

main().then(render => {
  render()
})
