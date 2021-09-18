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

每个管线对象均有此方法，它接受一个 unsigned long 类型的数字作为参数，返回一个管线布局对象中对应位置的绑定组布局对象。

> 译者注：若创建管线时没有传递布局对象，这个方法会根据着色器代码内的 group 特性自动构造出绑定组布局对象。

有一个需要注意的，那就是这个数字参数要小于设备限制列表中的 `maxBindGroups` 值。

## 默认管线布局

如果创建一个管线时，没有设置管线布局对象，那么会自动在内部创建一个默认的布局对象。这个过程在文档中尚未详尽解释，只说了是一种“反射”技术，然后一步一步构造出来。

具体过程要参考文档中 [WebGPU Spec 10.1.1 默认管线布局](https://www.w3.org/TR/webgpu/#default-pipeline-layout) 的创建步骤。

默认的管线布局对象，其 `bindGroupLayouts` 数组是空数组。

## 可编程阶段：GPUProgrammableStage

在创建管线对象时，需要用到参数对象，这个参数对象有不同可编程阶段可以设置，其中每一个阶段都是一个 GPUProgrammableStage 对象。这一点在下文管线创建部分会详细列举出来。

`GPUProgrammableStage` 类型的对象组织起了管线中具体的一个阶段用到什么 GPUShaderModule，其 WGSL 入口点函数名是什么，需要传递哪些常量值这些信息。

会有详细介绍。

``` web-idl
dictionary GPUProgrammableStage {
  required GPUShaderModule module;
  required USVString entryPoint;
  record<USVString, GPUPipelineConstantValue> constants;
};

typedef double GPUPipelineConstantValue;
```

每一个这样的对象，有两个必选参数：

- `module`，GPUShaderModule 类型的变量，着色器模块，参考着色器模块章节

- `entryPoint`，字符串，指定 `module` 着色器代码中的入口函数

还有一个可选参数 `constants`，是一个值是 GPUPipelineConstantValue 类型的 JavaScript 对象，它用来传递着色器代码中具有 `override` 特性的常量值。

这个对象的键可以是 WGSL 中特性 `override(i)` 括号里的 i，也可以是常量名。例如（以顶点阶段为例）：

``` js
const pipeline = device.createRenderPipeline({
  vertex: {
    /* ... */
    constants: {
      1300: 2.0, // 将传递给着色器代码中第 1300 个，也即 gain 常量
      depth: -1, // 将传递给着色器代码中的 depth 常量
    }
  }
})
```

对应着色器代码：

``` wgsl
[[override(1300)]] let gain: f32; // 将收到 2.0f
[[override]] let depth: f32; // 将收到 -1
[[override(0)]] let has_point_light: bool = true;
[[override(1200)]] let specular_param: f32 = 2.3;
[[override]] let width: f32 = 0.0;

// 其他代码
```

如果你想把这几个 WGSL 常量中带默认值的也一并覆盖掉，可以传递这样的对象：

``` js
const pipeline = device.createRenderPipeline({
  vertex: {
    /* ... */
    constants: {
      1300: 2.0, // 将传递给着色器代码中第 1300 个，也即 gain 常量
      depth: -1, // 将传递给着色器代码中的 depth 常量
      0: false,
      1200: 3.0,
      width: 20,
    }
  }
})
```

JavaScript 的数值类型转到 WGSL 时，会自动根据常量在 WGSL 中具体的类型（bool，i32，u32，f32）进行转换。

## 补充资料：管线和着色阶段

WebGPU 通过发出绘制命令或调度命令的方式向 GPU 下达指令。

管线在 GPU 执行的计算的行为，被描述为一系列的阶段，其中有一些是可编程的。在 WebGPU 中，执行绘制或调度之前需要创建管线，执行绘制的叫渲染管线，执行调度的叫计算管线。



## 如何验证可编程阶段对象的合规性

创建管线时，对某个阶段对象（设为  stage）及管线布局对象（设为 layout）是有要求的：

- stage.module 必须是一个有效的 `GPUShaderModule` 对象
- stage.module 的着色器代码中必须有一个入口函数，名字与 stage.entryPoint 要一致
- 对入口函数中用到的每个被绑定的变量，[验证绑定](#验证着色器变量绑定)
- 对入口函数中用到的每个采样纹理，设纹理为 texture，设采样器为 sampler，sampler.type 如果是 "filtering"，那么 texture.sampleType 不能是 "unfilterable-float"
- 对于 stage.constants 中的所有常量，在着色器中必须有对应的 override 常量；如果着色器中的常量没有使用初始化语法给定默认值，那么 stage.constants 中必须给定值。



## 如何验证某个着色器中被绑定的变量的合规性

和标题意图一样，这一小节可以指导着色器中被绑定变量的语法书写、组织。

对于着色器中某个被绑定的变量，记作 `variable`，设其 `group` 和 `bind` 的数字分别是 `bindGroupId` 和 `bindId`，另外设管线布局对象为 `pipelineLayout`，绑定组布局可由 `pipelineLayout.bindGroupLayouts[bindGroupId]` 得到并记作 `bindGroupLayout`：

- bindGroupLayout 必须有一个 binding 值与 `bindId` 一样的 entry 对象；

- 遍历 bindGroupLayout 中的 entries，设被遍历到的 GPUBindGroupLayoutEntry 变量为 entry：

  - 如果是 buffer 类型，且 entry.buffer.type 是

    - "uniform"，那么着色器代码中此 variable 使用 `var<uniform>` 声明
    - "storage"，那么着色器代码中此 variable 使用 `var<storage, read_write>` 声明
    - "read-only-storage"，那么着色器代码中此 variable 使用 `var<storage, read>` 声明

  - 如果是 buffer 类型且 entry.buffer.minBindingSize 不是0：

    - 如果着色器代码中某个结构体的最后一个字段是无界数组，那么 entry.buffer.minBindingSize 必须大于等于数组的偏移量与步幅的和
    - 如果着色器代码中某个结构体最后一个字段并不是无界数组，那么 entry.buffer.minBindingSize 必须大于等于结构体的大小

  - 如果是 sampler 类型，且 entry.sampler.type 是

    - "filtering"，那么 variable 使用 `sampler` 类型
    - "comparison"，那么 variable 使用 `comparison_sampler` 类型

  - 如果是 texture 类型，当且仅当 entry.texture.multisampled 是 true 时，variable 要使用 `texture_multisampled_2d<T>` 或 `texture_depth_multisampled_2d<T>` 类型；

  - 如果是 texture 类型，当 entry.texture.type 是

    - "float"，"unfilterable-float"，"sint"，"uint" 时，variable 要使用 `texture_1d<T>`, `texture_2d<T>`, `texture_2d_array<T>`, `texture_cube<T>`, `texture_cube_array<T>`, `texture_3d<T>`, 或 `texture_multisampled_2d<T>` 类型来声明；关于泛型参数 T，entry.texture.sampleType 是 "float"、"unfilterable-float" 时，T 是 f32，是 "sint" 时，T 是 i32，是 "uint" 时，T 是 u32；
    - "depth"，variable 要使用 `texture_depth_2d`, `texture_depth_2d_array`, `texture_depth_cube`, `texture_depth_cube_array` 或 `texture_depth_multisampled_2d` 类型来声明

  - 如果是 texture 类型，当 entry.texture.viewDimension 是

    - "1d"，variable 要使用 `texture_1d<T>` 声明；
    - "2d"，variable 要使用 `texture_2d<T>` 或 `texture_multisampled_2d<T>` 声明；
    - "2d-array"，variable 要使用 `texture_2d_array<T>` 声明；
    - "cube"，variable 要使用 `texture_cube<T>` 声明；
    - "cube-array"，variable 要使用 `texture_cube_array<T>` 声明；
    - "3d"，variable 要使用 `texture_3d<T>` 声明；

  - 如果是 storageTexture 类型，当 entry.storageTexture.viewDimension 是

    - "1d"，variable 要使用 `texture_storage_1d<T, A>` 类型来声明；

    - "2d"，variable 要使用 `texture_storage_2d<T, A>` 类型来声明；

    - "2d-array"，variable 要使用 `texture_storage_2d_array<T, A>` 类型来声明；

    - "3d"，variable 要使用 `texture_storage_3d<T, A>` 类型来声明；

      entry.storageTexture.access 是 "write-only" 时，上述泛型中的 A 要使用 `write`，泛型类型 T 要跟 entry.storageTexture.format 一样。

# 2 渲染管线

文字介绍。

介绍各个不同渲染阶段

## 管线的创建



## 图元拼装阶段



## 顶点着色阶段



## 片元着色阶段



## 深度模板测试阶段



## 颜色输出阶段



## 多重采样阶段



# 3 计算管线



如何创建（也可以异步创建）
