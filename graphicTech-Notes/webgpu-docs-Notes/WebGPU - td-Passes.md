Passes，称为通道

通道允许使用多个 Pipelines

Pipelines 允许切换不同的资源（bindGroup、VBO）

通道在设置好 Pipelines 和资源绑定、绘制命令触发之后，要进行编码，编码完成即可丢给指令编码器。

通道有两种

``` 
GPUProgramablePassE
├ GPURenderPassEncoder
└ GPUComputePassEncoder
```

本文介绍原文 13、14、15 章的部分内容。

# 可编程通道编码器：GPUProgrammablePassEncoder

有两种子类型，渲染通道编码器和计算通道编码器。

可编程通道编码器的主要功能就是将不同的 pipeline 和绑定组根据实际需要排列组合在一起，完成一帧完整的渲染或一次完整的计算。



## 主要功能

设置（切换）绑定组和设置（切换）管线。除此之外，还可以进行调试（忽略）



# 1 渲染通道编码器

主要介绍创建及创建所需的几大重要概念、绘制过程、光栅化选项及结束一个通道编码器几个功能。

# 2 计算通道编码器

主要介绍创建和调度两个功能。



