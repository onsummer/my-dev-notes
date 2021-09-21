参考自

[WebGPU 8. Resource Binding（资源绑定）](https://www.w3.org/TR/webgpu/#bindings)

[WGSL 5.1. Module Scope Variables（全局对象）](https://www.w3.org/TR/WGSL/#module-scope-variables)

[WGSL 9.3.2. Resource interface（资源接口）](https://www.w3.org/TR/WGSL/#resource-interface)

# WebGPU 中的 Uniform

接口预览：

- GPUBindGroup
- GPUBindGroupLayout
- GPUBuffer
- GPUBufferUsage
- GPUSampler
- GPUTexture

WebGPU 中，uniform 资源的传递是通过 UBO 完成的，会用到 `GPUBindGroup`、`GPUBindGroupLaayout` 来管理一组绑在一块的资源，正如 `GPUBindGroup` 的描述一样所说：

```
A GPUBindGroup defines a set of resources to be bound together in a group and how the resources are used in shader stages.
```

`GPUBindGroup` 管理了一组绑在一块的资源，并决定了在着色器阶段如何使用。

这里所谓的资源，有如下几种：

- 普通常量数字、类型数组
- 纹理
- 采样器

# 1 如何创建 Uniform 资源

## ① 普通常量数字/类型数组

``` js
const uniformBuffer = device.createBuffer({
  size: 16,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
})

// ---- 写入
const color = new Float32Array([0, .5, 0, 1])
device.queue.writeBuffer(
  uniformBuffer, // 传给谁
  0, 
  color.buffer, // 传递 ArrayBuffer
  color.byteOffset, // 从哪里开始
  color.byteLength // 取多长
)
```

## ② 纹理对象 `GPUTexture`

``` js
const texture = device.createTexture({
  size: [256, 256],
  format: "rgba8unorm", // 8 bit RGBA, un normal
  usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST
})
```

将图片数据写入纹理另开一坑写，在这里提一下，是 `GPUQueue.prototype.copyImageBitmapToTexture` 方法

## ③ 采样器 `GPUSampler`

``` js
const sampler = device.createSampler({
  minFilter: "linear",
  magFilter: "linear"
})
```

# 2 绑定组的作用和创建

``` js
const uniformBindGroup = device.createBindGroup({
  layout: bindGroupLayout, // 需要绑定组对应的 layout 对象
  entries: [
    /* ... */
  ]
})
```

## 绑定组的资源入口：entries 数组

类型是 `GPUBindGroupEntry[]`

它的 WebIDL 定义如下：

``` web-idl
typedef (GPUSampler or GPUTextureView or GPUBufferBinding or GPUExternalTexture) GPUBindingResource;

dictionary GPUBindGroupEntry {
  required GPUIndex32 binding;
  required GPUBindingResource resource;
};

dictionary GPUBufferBinding {
  required GPUBuffer buffer;
  GPUSize64 offset = 0;
  GPUSize64 size;
};
```

一个 `GPUBindGroupEntry` 表示了绑定组中的单个被绑定的资源，允许是 `GPUSampler`、`GPUTextureView`、`GPUBufferBinding` 和 `GPUExternalTexture`，前三个即采样器、纹理对象、UBO（常量数字/类型数组）。

例如：

``` js
const uniformBindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0), // <- 指定绑定组的布局对象，以后开文章说
  entries: [
    {
      binding: 0,
      resource: sampler, // <- 传入采样器对象
    },
    {
      binding: 1,
      resource: texture.createView() // <- 传入纹理对象的视图
    },
    {
      binding: 2,
      resource: {
        buffer: uniformBuffer // <- 传入 UBO
      }
    }
  ]
})
```

通过打组，可以很方便地将某种条件下的一组 uniform 资源分别传入着色器进行 WebGPU 渲染编程。

GPUBindGroup 的最大作用，就是隔离不相关的 uniform，把相关的资源摆在一块。



# 3 绑定组的布局对象

绑定组只是描述 JavaScript 环境中数据如何打组，WebGPU 渲染管线、WGSL 并不知道布局对象如何使用它。这个时候就需要布局对象 `GPUBindGroupLayout` 出马了。

``` 
A GPUBindGroupLayout defines the interface between a set of resources bound in a GPUBindGroup and their accessibility in shader stages.
```

仍然是靠设备对象创建：

``` js
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    /* ... */
  ]
})
```

它与 `GPUBindGroup` 类似，也需要一个 entries 数组，类型是 `GPUBindGroupLayoutEntry[]`：

``` web-idl
dictionary GPUBindGroupLayoutEntry {
  required GPUIndex32 binding;
  required GPUShaderStageFlags visibility;

  GPUBufferBindingLayout buffer;
  GPUSamplerBindingLayout sampler;
  GPUTextureBindingLayout texture;
  GPUStorageTextureBindingLayout storageTexture;
  GPUExternalTextureBindingLayout externalTexture;
};

// 上面 visibility 属性是 GPUShaderStage 类型的，指明某个绑定组的 entry 在哪个着色器阶段可见：

typedef [EnforceRange] unsigned long GPUShaderStageFlags;
[Exposed=(Window, DedicatedWorker)]
interface GPUShaderStage {
  const GPUFlagsConstant VERTEX   = 0x1; // 顶点着色器阶段
  const GPUFlagsConstant FRAGMENT = 0x2; // 片元着色器阶段
  const GPUFlagsConstant COMPUTE  = 0x4; // 计算着色器阶段
};
```

例如：

``` js
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0, // <- 绑定在 0 号资源
      visibility: GPUShaderStage.FRAGMENT,
      sampler: {
      	type: 'filtering'
    	}
    },
    {
      binding: 1, // <- 绑定在 1 号资源
      visibility: GPUShaderStage.FRAGMENT,
      texture: {
        sampleType: 'float'
      }
    },
    
    {
      binding: 2,
      visibility: GPUShaderStage.FRAGMENT,
      buffer: {
        type: 'uniform'
      }
    }
  ]
})
```

每一个 entry Descriptor 除了 binding、visibility 属性外，剩下 5 个可选属性是五选一，指定当前 binding 资源对应的具体信息。例如此处第 2 个 entry，被指定为 `buffer`，即 UBO，它的 type 是 `uniform`。

## 布局对象的两种用途

- 与绑定组对象配套使用
- 为管线与绑定组起连接桥梁的作用

```
   GPUBindGroup <----------------------┐
                              GPUBindGroupLayout
GPUPipelineBase <----------...---------┘
```



## 绑定组与其布局对象的连接

绑定组有一个 layout 属性，可以直接传递 `GPUBindGroupLayout` 对象，也可以从 `GPUPipelineBase` 中使用 `getBindGroupLayout` 方法获取。

例如：

``` js
const uniformBindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    /* ... */
  ]
})
```



## 布局对象与渲染管线的连接

需要借助 `GPUPipelineLayout` 来起作用

```
GPUBindGroupLayout <----------------------┐
                                GPUPipelineLayout
GPUPipelineBase    <----------------------┘
```

例如：

``` js
const pipelineLayout = device.createPipelineLayout({
  bindGroupLayouts: [bindGroupLayout]
})
const renderingPipeline = device.createRenderPipeline({
  layout: pipelineLayout
})
```



# 4 通道编码器 `GPUPassEncoder` 中如何设置

这部分已经到了渲染控制部分，和数据布局、传递应分开，属于 Renderer 设计的范畴。

## ① 设置 pipeline

``` js
passEncoder.setPipeline(pipeline)
```

## ② 设置绑定组

``` js
passEncoder.setBindGroup(0, uniformBindGroup)
```

## ③ 设置其他（VBO等）

``` js
passEncoder.setVertexBuffer(0, vbo)
```

## 最后绘制并结束一个通道

```js
passEncoder.draw(3, 1, 0, 0)
passEncoder.endPass()
```



# 5 在着色器代码中如何获得绑定组的资源

> WGSL 仍在更新，可能这部分会失效，我会尽力更新。

## ① UBO

需要借助结构体。

``` wgsl
// —— 片元着色器 ——

// -> 声明一个结构体类型
[[block]] struct Uniforms {
	uniform_color: vec4<f32>;
};
// -> 双方括号语法，指定其绑定ID是0，绑定组序号是0
[[binding(2), group(0)]] var<uniform> uniforms: Uniforms;

// —— 然后这个 uniforms 变量就可以在函数中调用了 ——
```

## ② 采样器

``` wgsl
[[binding(0), group(0)]] var mySampler: sampler;
```

## ③ 纹理

``` wgsl
[[binding(1), group(0)]] var myTexture: texture_2d<f32>;
```

