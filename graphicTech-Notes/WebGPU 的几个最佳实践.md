WebGPU 的几个最佳实践

来自 2022 WebGL & WebGPU Meetup 的 幻灯片

# 1 在能用的地方都用 label 属性

WebGPU 中的每个对象都有 label 属性，不管你是创建它的时候通过传递 descriptor 的 label 属性也好，亦或者是创建完成后直接访问其 label 属性也好。这个属性类似于一个 id，它能让对象更便于调试和观察，写它几乎不需要什么成本考量，但是调试的时候会非常、非常爽。

``` js
const projectionMatrixBuffer = gpuDevice.createBuffer({
  label: 'Projection Matrix Buffer',
  size: 12 * Float32Array.BYTES_PER_ELEMENT, // 故意设的 12，实际上矩阵应该要 16
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
})
const projectionMatrixArray = new Float32Array(16)

gpuDevice.queue.writeBuffer(projectionMatrixBuffer, 0, projectionMatrixArray)
```

上面代码故意写错的矩阵所用 GPUBuffer 的大小，在错误校验的时候就会带上 label 信息了：

```
// 控制台输出
Write range (bufferOffset: 0, size: 64) does not fit in [Buffer "Projection Matrix Buffer"] size (48).
```



# 2 使用调试组

指令缓冲（CommandBuffer）允许你增删调试组，调试组其实就是一组字符串，它指示的是哪部分代码在执行。错误校验的时候，报错消息会显示调用堆栈：

``` js
// --- 第一个调试点：标记当前帧 ---
commandEncoder.pushDebugGroup('Frame ${frameIndex}');
  // --- 第一个子调试点：标记灯光的更新 ---
  commandEncoder.pushDebugGroup('Clustered Light Compute Pass');
		// 譬如，在这里更新光源
    updateClusteredLights(commandEncoder);
  commandEncoder.popDebugGroup();
  // --- 结束第一个子调试点 ---
  // --- 第二个子调试点：标记渲染通道开始 ---
  commandEncoder.pushDebugGroup('Main Render Pass');
    // 触发绘制
    renderScene(commandEncoder);
  commandEncoder.popDebugGroup();
  // --- 结束第二个子调试点
commandEncoder.popDebugGroup();
// --- 结束第一个调试点 ---
```

这样，如果有报错消息，就会提示：

```
// 控制台输出
Binding sizes are too small for bind group [BindGroup] at index 0

Debug group stack:
> "Main Render Pass"
> "Frame 234"
```



# 3 从 Blob 中载入纹理图像

使用 Blob 创建的 `ImageBitmaps` 可以获得最佳的 JPG/PNG 纹理解码性能。

``` js
/**
 * 根据纹理图片路径异步创建纹理对象，并将纹理数据拷贝至对象中
 * @param {GPUDevice} gpuDevice 设备对象
 * @param {string} url 纹理图片路径
 */
async function createTextureFromImageUrl(gpuDevice, url) {
  const blob = await fetch(url).then((r) => r.blob())
  const source = await createImageBitmap(blob)
  
  const textureDescriptor = {
    label: `Image Texture ${url}`,
    size: {
      width: source.width,
      height: source.height,
    },
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
  }
  const texture = gpuDevice.createTexture(textureDescriptor)
  gpuDevice.queue.copyExternalImageToTexture(
    { source },
    { texture },
    textureDescriptor.size,
  )
  
  return texture
}
```

## 更推荐使用压缩格式的纹理资源

能用就用。

WebGPU 支持至少 3 种压缩纹理类型：

- texture-compression-bc
- texture-compression-etc2
- texture-compression-astc

支持多少是取决于硬件能力的，根据官方的讨论（[Github Issue 2083](https://github.com/gpuweb/gpuweb/issues/2083)），全平台都要支持 BC 格式（又名 DXT、S3TC），或者 ETC2、ASTC 压缩格式，以保证你可以用纹理压缩能力。

强烈推荐使用超压缩纹理格式（例如 [Basis Universal](https://github.com/BinomialLLC/basis_universal)），好处是可以无视设备，它都能转换到设备支持的格式上，这样就避免准备两种格式的纹理了。

原作者写了个库，用于在 WebGL 和 WebGPU 种加载压缩纹理，参考 [Github toji/web-texture-tool](https://github.com/toji/web-texture-tool)

WebGL 对压缩纹理的支持不太好，现在 WebGPU 原生就支持，所以尽可能用吧！



# 4 使用 glTF 处理库 gltf-transform

这是一个开源库，你可以在 GitHub 上找到它，它提供了命令行工具。

譬如，你可以使用它来压缩 glb 种的纹理：

``` shell
> gltf-transform etc1s paddle.glb paddle2.glb
paddle.glb (11.92 MB) → paddle2.glb (1.73 MB)
```

做到了视觉无损，但是从 Blender 导出的这个模型的体积能小很多。原模型的纹理是 5 张 2048 x 2048 的 PNG 图。

这库除了压缩纹理，还能缩放纹理，重采样，给几何数据附加 Google Draco 压缩等诸多功能。最终优化下来，glb 的体积只是原来的 5% 不到。

``` shell
> gltf-transform resize paddle.glb paddle2.glb --width 1024 --height 1024
> gltf-transform etc1s paddle2.glb paddle2.glb
> gltf-transform resample paddle2.glb paddle2.glb
> gltf-transform dedup paddle2.glb paddle2.glb
> gltf-transform draco paddle2.glb paddle2.glb

  paddle.glb (11.92 MB) → paddle2.glb (596.46 KB)
```



# 5 缓冲数据上载

WebGPU 中有很多种方式将数据传入缓冲，`writeBuffer()` 方法不一定是错误用法。当你在 wasm 中调用 WebGPU 时，你应该优先考虑 `writeBuffer()` 这个 API，这样就避免了额外的缓冲复制操作。

``` js
const projectionMatrixBuffer = gpuDevice.createBuffer({
  label: 'Projection Matrix Buffer',
  size: 16 * Float32Array.BYTES_PER_ELEMENT,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

// 当投影矩阵改变时（例如 window 改变了大小）
function updateProjectionMatrixBuffer(projectionMatrix) {
  const projectionMatrixArray = projectionMatrix.getAsFloat32Array();
  gpuDevice.queue.writeBuffer(projectionMatrixBuffer, 0, projectionMatrixArray);
}
```

原作者指出，创建 buffer 时设 `mappedAtCreation` 并不是必须的，有时候创建时不映射也是可以的，譬如对 glTF 中有关的缓冲加载。



# 6 推荐异步创建 pipeline

如果你不是马上就要渲染管线或者计算管线，尽量用 `createRenderPipelineAsync` 和 `createComputePipelineAsync` 这俩 API 来替代同步创建。

同步创建 pipeline，有可能会在底层去把管线的有关资源进行编译，这会中断 GPU 有关的步骤。

而对于异步创建，pipeline 没准备好就不会 resolve Promise，也就是说可以优先让 GPU 当前在干的事情先做完，再去折腾我所需要的管线。

下面看看对比代码：

``` js
// 同步创建计算管线
const computePipeline = gpuDevice.createComputePipeline({/* ... */})

computePass.setPipeline(computePipeline)
computePass.dispatch(32, 32) // 此时触发调度，着色器可能在编译，会卡
```

再看看异步创建的代码：

``` js
// 异步创建计算管线
const asyncComputePipeline = await gpuDevice.createComputePipelineAsync({/* ... */})

computePass.setPipeline(asyncComputePipeline)
computePass.dispatch(32, 32) // 这个时候着色器早已编译好，没有卡顿，棒棒哒
```



# 7 慎用隐式管线布局

隐式管线布局，尤其是独立的计算管线，或许对写 js 的时候很爽，但是这么做会带来俩潜在问题：

- 中断共享资源绑定组
- 更新着色器时发生点奇怪的事情

如果你的情况特别简单，可以使用隐式管线布局，但是能用显式创建管线布局就显式创建。

下面就是所谓的隐式管线布局的创建方式，先创建的管线对象，而后调用管线的 `getBindGroupLayout()` API 推断着色器代码中所需的管线布局对象。

``` js
const computePipeline = await gpuDevice.createComputePipelineAsync({
  // 不传递布局对象
  compute: {
    module: computeModule,
    entryPoint: 'computeMain'
  }
})

const computeBindGroup = gpuDevice.createBindGroup({
  // 获取隐式管线布局对象
  layout: computePipeline.getBindGroupLayout(0),
  entries: [{
    binding: 0,
    resource: { buffer: storageBuffer },
  }]
})
```



# 7 共享资源绑定组与绑定组布局对象

如果在渲染/计算过程中，有一些数值是不会变但是频繁要用的，这种情况你可以创建一个简单一点的资源绑定组布局，可用于任意一个使用了同一号绑定组的管线对象上。

首先，创建资源绑定组及其布局：

``` js
// 创建一个相机 UBO 的资源绑定组布局及其绑定组本体
const cameraBindGroupLayout = device.createBindGroupLayout({
  label: `Camera uniforms BindGroupLayout`,
  entries: [{
    binding: 0,
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    buffer: {},
  }]
})

const cameraBindGroup = gpu.device.createBindGroup({
  label: `Camera uniforms BindGroup`,
  layout: cameraBindGroupLayout,
  entries: [{
    binding: 0,
    resource: { buffer: cameraUniformsBuffer, },
  }],
})
```

随后，创建两条渲染管线，注意到这两条管线都用到了两个资源绑定组，有区别的地方就是用的材质资源绑定组是不一样的，共用了相机资源绑定组：

``` js
const renderPipelineA = gpuDevice.createRenderPipeline({
  label: `Render Pipeline A`,
  layout: gpuDevice.createPipelineLayout([cameraBindGroupLayout, materialBindGroupLayoutA]),
  /* Etc... */
});

const renderPipelineB = gpuDevice.createRenderPipeline({
  label: `Render Pipeline B`,
  layout: gpuDevice.createPipelineLayout([cameraBindGroupLayout, materialBindGroupLayoutB]),
  /* Etc... */
});
```

最后，在渲染循环的每一帧中，你只需设置一次相机的资源绑定组，以减少 CPU ~ GPU 的数据传递：

``` js
const renderPass = commandEncoder.beginRenderPass({/* ... */});

// 只设定一次相机的资源绑定组
renderPass.setBindGroup(0, cameraBindGroup);

for (const pipeline of activePipelines) {
  renderPass.setPipeline(pipeline.gpuRenderPipeline)
  for (const material of pipeline.materials) {
	  // 而对于管线中的材质资源绑定组，就分别设置了
    renderPass.setBindGroup(1, material.gpuBindGroup)
    
    // 此处设置 VBO 并发出绘制指令，略
    for (const mesh of material.meshes) {
      renderPass.setVertexBuffer(0, mesh.gpuVertexBuffer)
      renderPass.draw(mesh.drawCount)
    }
  }
}

renderPass.endPass()
```



# 原作附带信息

- 作者：Brandon Jones，推特 @Tojiro
- 原幻灯片：https://docs.google.com/presentation/d/1Q-RCJrZhw9nlZ5py7QxUVgKSyq61awHr2TyIjXxBmI0/edit#slide=id.p
- 更多额外阅读：https://toji.github.io/webgpu-best-practices/
- 一个很棒的原生 WebGPU 教程（英文）：https://alain.xyz/blog/raw-webgpu
- 对于纹理的对比细节：https://toji.github.io/webgpu-best-practices/img-textures.html
- 对于缓冲上载的细节：https://toji.github.io/webgpu-best-practices/buffer-uploads.html