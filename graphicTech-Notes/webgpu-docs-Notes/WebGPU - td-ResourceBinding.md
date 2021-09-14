资源绑定，即 JavaScript 中（即 CPU 端）如何对待传递到 GPU 的数据进行组织、分配的一种设计。

为了完成这个过程（CPU到GPU），WebGPU 设计了几个对象用于管理这些数据，这些数据包括 某些GPUBuffer（例如UBO，但是不包括VBO）、GPUTexture、GPUSampler、存储型纹理、外部纹理五种，这几个对象是：

- 资源绑定组（以后均简称绑定组）- GPUBindGroup
- 资源绑定组布局（以后称为绑定组的布局对象）- GPUBindGroupLayout
- 管线布局 - GPUPipelineLayout

和规范中顺序略有不同，我按我上面这个来。

# 1 关系简易图解

# 2 资源绑定组 GPUBindGroup

用途说明

## 如何创建



## 创建要遵守的规则



## 举例



# 3 资源绑定组的布局 GPUBindGroupLayout

用途说明

## 如何创建



## 创建要遵守的规则



## 举例



# 4 管线布局 GPUPipelineLayout

用途

## 如何创建



## 创建要遵守的规则



## 举例