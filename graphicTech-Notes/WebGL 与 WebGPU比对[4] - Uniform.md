VS FS 和 CS 是并行运行的，每个着色器入口函数都会并行运行

但是，有的数据对每个着色器都是一样的，这种数据的类型是“uniform”。

在 WebGPU 中，uniform 可以用 GPUBuffer 的形式传递给想传递的着色阶段，这个 Buffer 叫做 UniformBufferObject，即 UBO

WebGL 1.0 中没有 UBO 的概念，每个 uniform 类型的数据都是一条一条函数设定才能完成传递的；在 WebGL 2.0 中增加了 UBO

# WebGL 1.0 Uniform 传递

获取 uniform 的 location 后通过特定函数赋值。



# WebGL 2.0 UniformBuffer

https://www.khronos.org/registry/webgl/specs/latest/2.0/#3.7.16

https://blog.csdn.net/lsslws/article/details/73528103

https://blog.csdn.net/liuhongyi0104/article/details/103239673

https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html?exampleId=uniform-buffers#no-help

https://blog.csdn.net/qq_30621091/article/details/77897333



# WebGPU UniformBuffer

通过 pipeline 传递 bindGroupLayout 对象，而 renderPassEncoder 传递 bindGroupLayout 对象。

bindGroup 对象负责组织 ubo 和其它资源（texture 和 sampler 等）



---

本篇要讲讲 webgl 2.0 的 ubo，比对 webgpu 里的 uniformbuffer

webgpu 的 uniformbuffer 的更新可以使用 queue.writeBuffer