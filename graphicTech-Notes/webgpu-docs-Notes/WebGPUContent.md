思前想后，还是要讲一下“WebGPU Spec API”和“图形学”、“即时渲染技术”等概念的差异。

我所发布的这一系列博文，均为“WebGPU Spec API”的解读，而且是部分解读，还不一定在概念、细节上完全准确。只是，我喜欢吃这螃蟹，虽然的确有点扎嘴。

> 本篇不算教程，只能算是 WebGPU 发布黎明前夕对标准的学习与自我归纳，希望对你有帮助，有概念上的错漏在所难免。

WebGPU 的接口、对象类型、如何组合，以及其调用 GPU 的逻辑，深得 D3D12、Metal、Vulkan 这些现代图形开发技术的启发，多多少少都有它们的影子。但是，这并不是说把 WebGPU 的接口、对象的文档背熟，知道如何组合对象和传递数据，就能写出牛逼哄哄的渲染器、3D编辑器、通用计算工具的，那些仍需要其他领域的知识来辅助完成，这也说明了 WebGPU 就是一个 API 罢了。

开发者对 WebGPU 运用得多熟练，只能说明此人对工具有多熟悉，不一定能拿工具雕出花来。

说实话，WebGPU 和 WebGL 一样，对一些初学者来说，是有门槛的，WebGPU 似乎更高一些，如若再加上对即时渲染技术的掌控，对光照知识的理解，那属于难上加难，这样能劝退不少人，图形类编程技术人员是少一些。

# WebGPU 是什么

一种图形标准，主要在 Web 浏览器端使用 JavaScript 编程实现，也有其他语言（例如 Rust 的 Wgpu等）的实现。在这里以 Web 端为主，无特殊情况均指 Web 浏览器端的应用开发。

它通常会拿来与 WebGL 进行比较，有人说它是 WebGL 的继任者，我觉得这种说法并不是很全面。

## 起源不同

WebGL 的爹是 OpenGL，着色器语言 GLSL 继承自 OpenGL；WebGPU 的爹是 Metal、D3D12、Vulkan，标准的推动者有苹果、谷歌、Mozilla、科纳斯组（OpenGL 也是科纳斯组的规范之一）等，其着色器语言 WGSL 也是新设计的；

## 设计理念不同

WebGL 是走一步算一步的 API，若使用原生 API，需要对渲染的每一步进行精确调整，而且得按顺序，这意味着异步编程会比较麻烦。

WebGPU 是事先打包好数据、设计好计算过程、约定好输入输出，最后一次编码提交才进行计算，这种带“提前设计”的思维，提高了 GPU 访问数据的效率，减少了 CPU 到 GPU 的过程。

这就像做菜，WebGL 有点像做到啥就拿啥调料、食材，要做下一道菜还得中途洗锅。WebGPU 则一边座着高压锅炖汤，一边炒菜，而且每一步都精心准备好了食材配比、炒菜顺序。

## 功能差异

WebGL 即使到了 version2，对通用计算的支持还是不太行，WebGL 的主战场还是绘图。

WebGPU 在娘胎里就设计好了，它有两大功能：绘图和通用计算。

不过，**绘图方面，在量小的时候，二者几乎没有差别，WebGL 甚至写起来还快一些。**

## WebGL 不好吗

如果大家全部不能做封装，全部只用原生 API，那 WebGL 甚至在小场景下写起来还快一些，性能表现也没什么区别。

可问题就在于，封装可以屏蔽底层的差异，ThreeJs 和 BabylonJs 若保持封装不变，但是底层全部改用 WebGPU，其不仅仅可以在大场景时提高性能，还可以拥有 WebGPU 有但是 WebGL 没有的新特性，甚至还能扩展出通用计算接口来，使用应用级别库的开发者能享受到的好处是很大的。

那么一定要等着这些库封装吗？不是的，了解熟悉底层 API 也是有好处的。

> 世事无绝对，只有合不合。

长远看，WebGPU 一定会占据前端通用图形技术的一把手，WebGL 会退居二线，完全取代不太可能。

# 文章目录

- [WebGPU 的类型约定之WebIDL](./WebGPU - P1 - WebIDL.md)

基础概念部分

- [WebGPU 规范篇 01 基础](./WebGPU - P2 - 01Fundamentals.md)
- [WebGPU 规范篇 02 对象初始化](./WebGPU - P2 - 02Initialization.md)

数据资源部分

- [WebGPU 规范篇 03 缓存对象](./WebGPU - P2 - 03Buffers.md)
- [WebGPU 规范篇 04 纹理](./WebGPU - P2 - 04Texture.md)
- [WebGPU 规范篇 05 采样器](./WebGPU - P2 - 05Sampler.md)
- [WebGPU 规范篇 06 资源及其打组绑定](./WebGPU - P2 - 06ResourceBinding.md)

渲染调度部分

- [WebGPU 规范篇 07 着色器模块](./WebGPU - P2 - 07ShaderModules.md)
- [WebGPU 规范篇 08 管线](./WebGPU - P2 - 08Pipelines.md)
- [WebGPU 规范篇 09 通道](./WebGPU - P2 - 09Passes.md)
- [WebGPU 规范篇 10 指令编码与队列](./WebGPU - P2 - 10CommandEncoding&Queue.md)
- [WebGPU 规范篇 11 Canvas上下文](./WebGPU - P2 - 11Canvas&WebGPUContext.md)

补充资料

- [WebGPU 补充篇之 VertexBuffer](./WebGPU - P3 - 01VertexBuffer.md)
- [WebGPU 补充篇之 Uniform](./WebGPU - P3 - 02Uniform.md)

卷II

- 猝死之前。



# 之后的工作

写此系列全凭一腔热情，我也发现了 WebGPU 与 WGSL 的联系之紧密。

写完这个系列后，我已经精疲力尽，打算慢慢修修补补表述，以及学习规范中的其他散碎知识，届时会以卷二继续发布。

虽然 WGSL 大概我过了一眼，但是在 WebGPU 正式登上浏览器正式版之前，我没打算在短时间内匆匆动笔。



# 版权与内容声明

留我个名就好了，共同学习进步。

---

肯定会有错漏、表意不畅，希望指出。