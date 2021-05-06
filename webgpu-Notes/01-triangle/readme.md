> 如果本篇的代码不能跑了，请联系我或自己看看文档试试修改。
> 发布日：2021年3月30日；更新日 2021年5月6日。

# 入口：navigator.gpu

WebGL1 或 WebGL2 是从 `canvas.getContext('webgl')` 这样获取一个上下文对象来进行一切操作的。

而 WebGPU 则直接从浏览器对象中获取一个附件一样的东西：`navigator.gpu`，如果你在控制台获取这玩意儿获取不到，说明你没开实验特性或浏览器压根不支持 WebGPU。

> 这就很像从主机里掏出一张显卡一样。

# 适配器 & 设备

代码最开始要从这个 gpu 对象里请求一个“适配器（adapter，是 er 不是 or）”，然后从适配器里请求一个“设备（device）”。

``` js
const adapter = await navigator.gpu.requestAdapter()
const device = await adapter.requestDevice()
```

**适配器**，指的是物理显卡。聪明的你一定能猜到，除了N卡，还有高通骁龙上面的 SoC 图形处理器，所以这个 `requestAdapter()` 是可以传递参数的。

**设备**，即把物理显卡进行逻辑对象化。当调用 `requestDevice()` 时，允许请求一些显卡的扩展特性，就像 WebGL 会通过请求扩展来引入额外的功能一样。

后续代码中，大量的操作均以函数调用的方式，由设备发出。这个设备对象，就类似 WebGL 的 context。区别的地方，就是“设备”它是显卡功能的集合体，更接近显卡本身，而 context 只是与显卡对话的中间人，是一个上下文对象。

> 休息一下！

# 交换链、渲染管线、WebGPU上下文、编码器

> 不理解 WebGPU 的渲染流程，就没办法进行下一步的。
> 关于交换链的描述，[这里](https://github.com/hjlld/LearningWebGPU/blob/glsl-spirv/Lesson1_Triangle_and_square/Tutorial/Lesson1_Triangle_and_square.md) 讲得比我好。

- canvas -创建-> WebGPU上下文 -创建-> 交换链 -创建-> canvas像素内存视图（视图用于操作像素内存，辅助交换链的交换工作，将显卡上渲染好的数据写入像素内存） 
- 设备 -创建-> “命令”编码器 -创建-> “渲染通道”编码器 

渲染进行时，渲染通道编码器 会将 “渲染通道描述对象”，通过 **交换链** 绘制到 canvas 上。

编码器如何访问canvas？通过 `this.swapChain.getCurrentTexture().createView()` 创建出来的对象来访问 canvas 上的像素内存，把显存里绘制好的数据写入 canvas 上的像素内存。

``` js
const textureView = swapChain.getCurrentTexture().createView()
const renderPassDescriptor = {
  colorAttachments: [{
    view: textureView,
    loadValue: {
      r: 0.0, g: 0.0, b: 0.0, a: 1.0
    }
  }]
}
const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
```

“命令”编码器通过传递进来的参数与交换链上的 canvas 像素内存作绑定，返回一个 “渲染通道”编码器，“渲染通道”编码器则通过设置渲染管线、调用函数来完成绘制。

``` js
passEncoder.setPipeline(pipeline)
passEncoder.draw(3, 1, 0, 0)
```

最后，结束此渲染通道，结束指令编码器，所有指令扔给设备。

``` js
passEncoder.endPass()
device.queue.submit([commandEncoder.finish()])
```

# 提示

若要进行代码结构优化，不想堆屎山，恭喜你，一个未来未来的架构师正在发芽，当前进度：新建文件夹。

优化的第一步，先把以下三个对象提升生命周期：

- 适配器
- 设备
- 交换链

渲染一次（帧）所需的着色器、编码器、管线和数据可能不尽一样，但是以上仨货基本不变。

现在顶点数据写死在着色器中，后续会从内存中读取并传入，类似 WebGLBuffer。

大致结构可布局如下：

```
const adapter = // 请求适配器
const gtx4090ti = // 请求设备
const swapChain = // 从canvas上下文中获取交换链

// 经典的 rAF
function requestNewFrame() {
  const pipeline = // 创建管线
  const cmdEncoder = // 创建命令编码器
  const passEncoder = // 创建渲染通道编码器
  /*
    passEncoder 设置绘制命令
  */
  // 搞定了当前帧的所有准备，提交给设备

  requestAnimationFrame(requestNewFrame)
}

requestNewFrame()
```

或者使用异步的写法

``` js
async function init(/*参数*/) {
  const adapter = await ...// 请求适配器
	const gtx4090ti = await ...// 请求设备
	const swapChain = // 从canvas上下文中获取交换链
  
  const requestNewFrame = () => {
    /*
     创建管线、编码器，使用编码器进行绘制
    */
    requestAnimationFrame(requestNewFrame)
  }
  return requestNewFrame
}

init(/*传参*/).then(requestFn => {
  requestFn()
})
```

