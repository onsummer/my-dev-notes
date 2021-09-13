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

