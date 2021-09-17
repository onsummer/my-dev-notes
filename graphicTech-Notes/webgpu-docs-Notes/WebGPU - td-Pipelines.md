https://www.w3.org/TR/webgpu/#pipelines

```
GPUPipelineBase
├ GPURenderPipeline
└ GPUComputePipeline
```

# 管线

管线代表某种计算的过程，在 WebGPU 中，有渲染管线和计算管线两种。

这一过程需要用到绑定组、VBO、着色器等对象或资源，然后最终能输出一些内容，譬如渲染管线输出颜色值（以颜色附件形式），计算管线输出到其指定的地方，此处就不列举太详细了。

管线在结构上看，由一系列 **可编程阶段** 和一些固定的状态组合而成。

> 注意，根据操作系统、显卡驱动不同，有部分固定的状态会编译到着色器代码中，因此将他们组合成一个管线对象里是不错的选择。

两种管线对象均可由设备对象创建。

在对应的通道编码器中，可以切换管线以进行不同的计算过程。

# 1 基础管线

``` web-idl
dictionary GPUPipelineDescriptorBase : GPUObjectDescriptorBase {
	GPUPipelineLayout layout;
};

interface mixin GPUPipelineBase {
	GPUBindGroupLayout getBindGroupLayout(unsigned long index);
};
```

两种管线在创建时均需要参数对象，参数对象各自有不同的具体类型，但均继承自这里的 `GPUPipelineDescriptorBase` 类型。

两种管线也均继承自基础管线类型 `GPUPipelineBase`。

## 基础管线的 getBindGroupLayout 方法



## 1.1 默认管线布局



## 1.2 可编程阶段：GPUProgrammableStage

这块重点，着重翻译。



# 2 渲染管线

文字介绍。

介绍各个不同渲染阶段

## 图元拼装阶段



## 顶点着色阶段



## 片元着色阶段



## 深度模板测试阶段



## 颜色输出阶段



## 多重采样阶段



# 3 计算管线



如何创建（也可以异步创建）
