不具体介绍wgsl和glsl的区别，范围太大

只介绍 WebGPU API 和 WebGL API 上的差别



WebGPU 支持自定义指定入口函数。WebGPU 支持获取编译信息

WebGPU 可以先创建着色器模块对象，而不编译。

着色器模块由 pipeline 使用，而 pipeline 最终由 renderPassEncoder 所设置，即 renderPassEncoder.setPipeline

WebGL 中 pipeline 对应的对象是 WebGLProgram，每次切换就需要 gl.useProgram



> 新认识
>
> 为什么不在 PassEncoder 上切换 Pipeline 完成单 Pass 多道计算？
>
> 因为没有意义。
>
> 如果是 RenderPassEncoder，那么它的使命就是在当前管线的片元着色器上返回计算好的片元值，并写入目标关联附件上，随后，我们就能从各个附件中获取计算的结果了；
>
> 假定你在 RenderPassEncoder 上切换 Pipeline 来表示不同的计算过程，然后切换 VBO、绑定组来传递渲染原料，但是第 1 道 Pipeline 和第 N 道 Pipeline 不都是写在关联的附件上吗？如果是离屏渲染或者延迟渲染，那就相当于新的 Pipeline 的结果覆盖了旧的 Pipeline 渲染的结果了，也就是白计算了。
>
> 不过，ComputePipeline 的输出是在绑定的资源上的，ComputePassEncoder 不关联输出结果，你可以在 dispatch 后立马让 commandEncoder 发起 Buffer 的拷贝指令：你会得到错误的结果，因为 ComputePassEncoder 还没有 endPass！所以说，ComputePassEncoder 也不能通过切换 Pipeline 完成前后关联的计算任务，因为如果计算管线用到的 Buffer 有前后关系的话，必须通过指令编码的拷贝指令完成数据的交换，但是此时通道尚未结束，拷贝数据的指令是拷贝不到东西的。
>
> 也许你会说，我在同一个 ComputePassEncoder 切换 ComputePipeline 完成前后无关联的计算任务不就完了？那你为啥不用两个 Pass 呢？同一个 Pass 中切换 Pipeline 完成前后无关的计算任务，看似节约了一个 Pass，但是实际上编码到指令缓冲后，一前一后仍然是顺序执行，和两个 Pass 没有太大区别。



# 启发：Pass 能不能切换 Pipeline

可以，但是可能没什么必要。

通常，一个 RenderPass 会把设置好的管线、资源完成计算，然后写入到关联的颜色、深度模板附件上，这是编码器的职责。执行管线的触发函数是编码器的 `drawXXX()` 方法，一旦触发，就会跑完整个管线；倘若你在 draw 结束后切换管线、资源而不是 endPass，那么会继续执行管线，继续在关联的颜色、深度模板附件上画图，然后这两道 pipeline 运行结束，你才 endPass ——

颇有“先用黄色颜料画个三角形，然后用红色颜料画一只猫，最后把画交了”的感觉。

殊不知，执行两次 draw 操作大多数时候没必要。

因为你可以把两个管线混合在一起，把 VBO 合并在一起，把资源绑定组也合并在一起。

在渲染通道中，一个 Pass 的结束，完成的是一帧。一个 Pipeline，只是绘制一帧的一个步骤，你为了完成一帧的绘制，一口气画完和三口气画完，对程序来说可能真没什么差别。

除非，你的这条管线的绘制逻辑已经复杂到 WGSL 都不好写了，你得分多个 Pipeline（也就是多组着色器）、多个 VBO、多个绑定组，进行多次 draw，譬如：

``` js
const renderPass = commandEncoder.beginRenderPass({/* ... */});

// 只设定一次相机的资源绑定组
renderPass.setBindGroup(0, cameraBindGroup);

// 对不同材质的物体（mesh），执行它自己的渲染管线，多次绘制完成一帧
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

而对于计算通道，其实也是类似的，只不过当计算通道 dispatch 后，它的没有特定的输出，只是在管线内完成了对绑定的资源的读取、写入。如果你的每一次 dispatch 是互不干扰的，不会出现上一个 dispatch 的结果要给下一个 dispatch 用，即发生需要在指令编码器上拷贝缓冲等情况，其实你可以切换 Pipeline、切换绑定组，让多次 dispatch 鱼贯而行。

但是笔者认为，你如果真的需要对这种资源前后无关的通用计算，为何要做成多个 Pipeline 呢？毕竟计算管线没有输出，它只能读取、修改传进来的绑定组上的资源，你把多个 Pipeline 的着色器合并成一个，分别操作不同的资源，也是一样的。

---

前两篇文章介绍了 WebGL 和 WebGPU 是如何准备顶点和数字型 Uniform 数据的（纹理留到下一篇），当渲染所需的原材料准备完成后，就要进入逻辑组装的过程。

WebGL 在这方面通过指定“WebGLProgram”，最终触发“drawArrays”或“drawElements”来启动渲染/计算。全局状态为特征的 WebGL 显然做多步骤渲染来说会麻烦一些，WebGPU 改善了渲染计算过程的接口设计，允许开发者组装更复杂的渲染、计算流程。

以所有的“draw”函数调用为分界线，调用后，就认为 CPU 端的任务已经完成，开始移交准备好的渲染、计算原材料（数据与着色器程序）至 GPU，进而运行起渲染管线，直至输出到帧缓冲/Canvas，我称 draw 这个行为是“一个通道”。

> WebGPU 的出现，除了渲染的功能，还出现了通用计算功能，draw 也有了兄弟概念：dispatch（调度），下文会对比介绍。



# 1. WebGL

## 1.1. 使用 WebGLProgram 表示一个计算过程

WebGL 的整个渲染管线（虽然没有管线 API）中，能介入编程的就两处：**顶点着色阶段** 和**片元着色阶段**，分别使用顶点着色器和片元着色器完成渲染过程的定制。

很多书或入门教程都会说，顶点着色器和片元着色器是成对出现的，而能管理这两个着色器的上层容器对象，就叫做程序对象（接口 `WebGLProgram`）。

``` js
const vertexShader = gl.createShader(gl.VERTEX_SHADER) // WebGLShader
gl.shaderSource(vertexShader, vertexShaderSource)
gl.compileShader(vertexShader)

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) // WebGLShader
gl.shaderSource(fragmentShader, fragmentShaderSource)
gl.compileShader(fragmentShader)

const program = gl.createProgram() // WebGLProgram
gl.attachShader(program, vertexShader)
gl.attachShader(program, fragmentShader)
gl.linkProgram(program)
```

其实，真正的渲染管线是有很多步骤的，顶点着色和片元着色只是比较有代表性：

- 顶点着色器大多数时候负责取色、图形变换
- 片元着色大多数时候负责计算并输出屏幕空间的片元颜色

既然 WebGL 只能定制这两个阶段，又因为这俩 `WebGLShader` 是被程序对象（`WebGLProgram`）管理的，所以，一个程序对象所代表的那个“管线”，通常用于执行一个通道的计算。

在复杂的 Web 三维开发中，一个通道还不足以将想要的一帧画面渲染完成，这个时候要切换着色器程序，再进行 `drawArrays/drawElements`，绘制下一个通道，这样组合多个通道的绘制结果，就能在一个 requestAnimationFrame 中完成想要的渲染。



## 1.2. WebGL 没有通道 API

上文提及，在一帧的渲染过程中，有可能需要多个通道共同完成渲染。最后一次 `gl.drawXXX` 的调用会使用一个绘制到目标帧缓冲的 `WebGLProgram`，这么说可能很抽象，不妨考虑这样一帧的渲染过程：

- 渲染法线、漫反射信息到 FBO1 中；
- 渲染光照信息到 FBO2 中；
- 使用 FBO1 和 FBO2，把最后结果渲染到 Canvas 上。

每一步都需要自己的 `WebGLProgram`，而且每一步都要全局切换各种 Buffer、Texture、Uniform 的绑定，这样就需要一个封装对象来完成这些状态的切换，可惜的是 WebGL 并没有这种对象，大多数时候是第三方库使用类似的类完成的。

因此，如果你不用第三方库（ThreeJS等），那么你就要考虑设计自己的通道类来管理通道了。

> 当然，随着现代 GPU 的特性挖掘，一个通道不一定是为了绘制一张“画”，因为有通用计算技术的出现，所以我更乐意称一个通道为“一个计算集合，由一系列计算过程有逻辑地构成”。在 WebGPU 也就是下面要介绍的内容中会提及计算通道，那个就是为通用计算准备的。



# 2. WebGPU

## 2.1. 使用 Pipeline 组装管线中各个阶段

在 WebGPU 中，一个计算过程的任务就交由“管线”完成，也就是我们在各种资料里见得到的“可编程管线”的具象化 API；在 WebGPU 中，可编程管线有两类：

- 渲染管线，`GPURenderPipeline`
- 计算管线，`GPUComputePipeline`

管线对象在创建时，会传递一个参数对象，用不同的状态属性配置不同的管线阶段。

> 回顾，WebGL 是使用 `gl.attachShader()` 方法配置两个 WebGLShader 附着到程序对象上的。

对渲染管线来说，除了可以配置顶点着色器、片元着色器之外，还允许使用其它的状态来配置管线中的其它状态：

- 使用 `GPUPrimitiveState` 对象设置 primitive 状态，配置图元的装配阶段和光栅化阶段；
- 使用 `GPUDepthStencilState` 对象设置 depthStencil 状态，配置深度、模板测试以及光栅化阶段；
- 使用 `GPUMultisampleState` 对象设置 multisample 状态，配置光栅化阶段中的多重采样。

具体内容需要参考 WebGPU 标准的文档。下面举个例子：

``` js
const renderPipeline = device.createRenderPipeline({
  // --- 布局 ---
  layout: pipelineLayout,
  
  // --- 五大状态用于配置渲染管线的各个阶段
  vertex: {
    module: device.createShaderModule({ /* 顶点着色器参数 */ }),
    // ...
  },
  fragment: {
    module: device.createShaderModule({ /* 片元着色器参数 */ }),
    // ...
  },
  primitive: { /* 设置图元状态 */ },
  depthStencil: { /* 设置深度模板状态 */ },
  multisample: { /* 设置多重采样状态 */ }
})
```

然后再看一个异步创建计算管线的例子：

``` js
const computePipeline = await device.createComputePipelineAsync({
  // --- 布局 ---
  layout: pipelineLayout,
  
  // --- 计算管线只需配置计算状态 ---
  compute: {
    module: device.createShaderModule({ /* 计算着色器参数 */ }),
    // ...
  }
})
```

读者可自行比对 WebGL 中 `WebGLProgram` + `WebGLShader` 的组合。

> 题外话，我在我的另一文还提到过，管线还具备了 WebGL 中的 VAO 的作用，感兴趣的可以找找看看。管线的片元状态还承担了 MRT 的信息。



## 2.2. 使用 PassEncoder 调度管线内的行为

由上一小节可知，管线对象收集了对应管线各个阶段所需的参数。这说明了管线是一个具备行为的过程。

光有武林秘籍，没有人练，武功是体现不出来的。

所以，PassEncoder（通道编码器）就起了这么一个作用，它负责记录 GPU 计算一个通道的前后逻辑，可以对其设置管线、顶点相关的缓冲对象、资源绑定组，最后触发计算。

计算通道编码器（`GPUComputePassEncoder`）的触发动作是调用 `dispatch()` 方法，这个方法译作“调度”；渲染通道编码器（`GPURenderPassEncoder`）的触发动作是它的各个 `“draw”` 方法，即触发绘制。

这个时候就体现出面向对象编程的威力了，你可以将一个通道内的行为（即管线）、数据（即资源绑定组和各种缓冲对象）分别创建，独立于通道编码器之外，这样，面对不同的通道计算时，就可以按需选用不同的管线和数据，进而甚至可以实现管线或者资源的共用。

通道编码器这一小节没有示例代码，示例代码在下一小节。



## 2.3. 使用 CommandEncoder 编码多个通道

WebGPU 使用现代图形 API 的思想，将所有 GPU 该做的操作、需要信息事先编码至一个叫“CommandBuffer（指令缓冲）”的容器上，最后统一由 CPU 提交至 GPU，GPU 拿到就吭哧吭哧执行。

编码指令缓冲的对象叫做 `GPUCommandEncoder`，即指令编码器，它最大的作用就是创建两种通道编码器（`commandEncoder.begin[Render/Compute]Pass()`），以及发出提交动作（`commandEncoder.finish()`），最终生成这一帧所需的所有指令。

话不多说，这里直接借用 austin-eng 的例子 [ShadowMapping（阴影映射）](https://austin-eng.com/webgpu-samples/samples/shadowMapping)

``` js
// 创建指令编码器
const commandEncoder = device.createCommandEncoder()

{
  // 阴影通道的编码过程
  const shadowPass = commandEncoder.beginRenderPass(shadowPassDescriptor)
  
  // 使用阴影渲染管线
  shadowPass.setPipeline(shadowPipeline)
  shadowPass.setBindGroup(0, sceneBindGroupForShadow)
  shadowPass.setBindGroup(1, modelBindGroup)
  shadowPass.setVertexBuffer(0, vertexBuffer)
  shadowPass.setIndexBuffer(indexBuffer, 'uint16')
  shadowPass.drawIndexed(indexCount)
  shadowPass.endPass()
}
{
  // 渲染通道常规操作
  const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
  
  // 使用常规渲染管线
  renderPass.setPipeline(pipeline)
  renderPass.setBindGroup(0, sceneBindGroupForRender)
  renderPass.setBindGroup(1, modelBindGroup)
  renderPass.setVertexBuffer(0, vertexBuffer)
  renderPass.setIndexBuffer(indexBuffer, 'uint16')
  renderPass.drawIndexed(indexCount)
  renderPass.endPass()
}
device.queue.submit([commandEncoder.finish()]);
```

为了完成三维物体的阴影渲染，在阴影映射有关的技术中一般会把阴影信息使用一个通道先绘制出来，然后把阴影信息传给下一个通道进而完成阴影的效果。

在上面的代码中，就使用了两个 RenderPassEncoder 进行阴影的先后步骤渲染。它们在 draw 之前就可以设置不同的渲染材料，包括代表行为的管线，以及代表资源的绑定组、各类缓冲等。



## 2.4. PassEncoder 和 Pipeline 的关系

WebGPU 中的 Pipeline 被划分成了多个阶段，其中有三个阶段是可编程的，其它的阶段是可配置的。管线由于在三个可编程阶段拥有了着色器模块，所以管线对象更多的是扮演一个“执行者”，它代表的是某个单一计算过程的全部行为，而且是发生在 GPU 上。

而对于 PassEncoder，也就是通道编码器，它拥有一系列 `setXXX` 方法，它的角色更多的是“调度者”。

通道编码器在结束编码后，整个被编码的过程就代表了一个 Pass（通道）的计算流程。



# 3. 总结

多个时间很短的画面，就构成了动态的渲染结果。这每一个画面，叫做帧。而每一帧，在实时渲染技术中用多个“通道”，通过图形学或实时渲染知识有逻辑地组装在一起共同完成。

通道由行为和数据构成。

行为由着色器程序实现，也就是“你想在这一个通道做什么计算”，在 WebGL 中使用 `WebGLProgram` 附着两个着色器，而在 WebGPU 中使用 `GPURenderPipeline/GPUComputePipeline` 装配管线的各个阶段状态。

而数据，则希望读者去看我写的 Uniform 和 顶点缓冲文章了。

每一帧，在 WebGL 代码中，其实就是不断切换 `WebGLProgram`，绑定不同数据，最后发出 draw 动作完成；在 WebGPU 代码中，就是创建指令编码器、开始通道编码、结束通道编码、结束指令编码，最后提交指令缓冲完成。

WebGPU 把 `WebGLProgram` 与 `WebGLShader` 的行为职能抽离到 `GPU[Render/Compute]Pipeline` 和 `GPUShaderModule` 中去了，这样就可以在帧运算中独立出行为对象。

