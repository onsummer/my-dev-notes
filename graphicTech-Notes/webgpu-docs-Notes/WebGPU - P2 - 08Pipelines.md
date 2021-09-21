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

## 1.1 基础管线的 getBindGroupLayout 方法

每个管线对象均有此方法，它接受一个 unsigned long 类型的数字作为参数，返回一个管线布局对象中对应位置的绑定组布局对象。

> 译者注：若创建管线时没有传递布局对象，这个方法会根据着色器代码内的 group 特性自动构造出绑定组布局对象。

有一个需要注意的，那就是这个数字参数要小于设备限制列表中的 `maxBindGroups` 值。

## 1.2 默认管线布局

如果创建一个管线时，没有设置管线布局对象，那么会自动在内部创建一个默认的布局对象。这个过程在文档中尚未详尽解释，只说了是一种“反射”技术，然后一步一步构造出来。

具体过程要参考文档中 [WebGPU Spec 10.1.1 默认管线布局](https://www.w3.org/TR/webgpu/#default-pipeline-layout) 的创建步骤。

默认的管线布局对象，其 `bindGroupLayouts` 数组是空数组。

## 1.3 可编程阶段：GPUProgrammableStage

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

## 1.4 补充资料：管线和着色阶段

WebGPU 通过发出绘制命令或调度命令的方式向 GPU 下达指令。

管线在 GPU 执行的计算的行为，被描述为一系列的阶段，其中有一些是可编程的。在 WebGPU 中，执行绘制或调度之前需要创建管线，执行绘制的叫渲染管线，执行调度的叫计算管线。



## 1.5 如何验证可编程阶段对象的合规性

创建管线时，对某个阶段对象（设为  stage）及管线布局对象（设为 layout）是有要求的：

- stage.module 必须是一个有效的 `GPUShaderModule` 对象
- stage.module 的着色器代码中必须有一个入口函数，名字与 stage.entryPoint 要一致
- 对入口函数中用到的每个被绑定的变量，[验证绑定](#验证着色器变量绑定)
- 对入口函数中用到的每个采样纹理，设纹理为 texture，设采样器为 sampler，sampler.type 如果是 "filtering"，那么 texture.sampleType 不能是 "unfilterable-float"
- 对于 stage.constants 中的所有常量，在着色器中必须有对应的 override 常量；如果着色器中的常量没有使用初始化语法给定默认值，那么 stage.constants 中必须给定值。



## 1.6 如何验证某个着色器中被绑定的变量的合规性

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

渲染管线 `GPURenderPipeline` 是一种控制着顶点着色和片元着色阶段的管线。

它可以被渲染通道编码器 `GPURenderPassEncoder` 和 渲染打包编码器 `GPURenderBundleEncoder` 使用。

渲染管线的输入有：

- 通过 `GPUPipelineLayout` 提供的绑定组所绑定的资源
- 顶点和索引数据，由下面 [顶点着色阶段](#顶点着色阶段) 使用
- 颜色附件，由颜色目标状态描述
- 一个可选的深度模板附件，由深度模板状态描述

渲染管线的输出有：

- 绑定组中类型为 `"storage"` 的 GPUBuffer 资源
- 绑定组中 `access` 属性为 `"write-only"` 的 GPUStorageTexture 资源
- 颜色附件
- 可选的深度模板附件

渲染管线有如下几个 **渲染阶段**：

- 顶点提取（Vertex Fetch），由 `GPUVertexState` 对象的 buffers 属性来描述、控制
- 顶点着色（Vertex Shader），由 `GPUVertexState` 对象描述、控制
- 图元装配（Primitive Assembly），由 `GPUPrimitiveState` 对象描述、控制
- 光栅化（Rasterization），由 `GPUPrimitiveState`、`GPUDepthStencilState` 和 `GPUMultisampleState` 对象来描述、控制
- 片元着色（Fragment Shader），由 `GPUFragmentState` 对象来控制
- 依次模板测试及操作（StencilTest）和深度测试并写入（DepthTest），由 `GPUDepthStencilState` 对象描述、控制
- 融合输出，由 `GPUFragmentState` 对象的 targets 属性来描述、控制

上述的 `GPUVertexState`、`GPUPrimitiveState`、`GPUFragmentState`、`GPUDepthStencilState`、`GPUMultisampleState` 类型在下文的 [顶点着色阶段](#顶点着色阶段)、[图元拼装阶段](#图元拼装阶段)、[片元着色阶段](#片元着色阶段)、[深度模板测试阶段](#深度模板测试阶段)、[多重采样阶段](#多重采样阶段) 几个小节均有介绍，对应着接下来 [渲染管线创建](#渲染管线创建) 小节中介绍的 `GPURenderPipelineDescriptor` 对象中的 `vertex`、`primitive`、`fragment`、`depthStencil`、`fragment` 字段。

这 5 个阶段中，只有顶点着色阶段和片元着色阶段是 [可编程阶段](#可编程阶段：GPUProgrammableStage)。

渲染管线的 WebIDL 定义如下：

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPURenderPipeline {
};
GPURenderPipeline includes GPUObjectBase;
GPURenderPipeline includes GPUPipelineBase;
```



## 2.1 管线的创建

渲染管线是通过设备对象的 `createRenderPipeline` 方法来创建的。

创建渲染管线需要一个 `GPURenderPipelineDescriptor` 类型的对象作为参数。

``` web-idl
dictionary GPURenderPipelineDescriptor : GPUPipelineDescriptorBase {
  required GPUVertexState vertex;
  GPUPrimitiveState primitive = {};
  GPUDepthStencilState depthStencil;
  GPUMultisampleState multisample = {};
  GPUFragmentState fragment;
};
```

在此对象中，有若干个阶段状态，在此简单描述每个字段的用途，后面小节会详细介绍它们对应的类。

- `vertex` 字段，`GPUVertexState` 类型的 JavaScript 对象，是一个可编程阶段，除了可编程阶段对象的属性外，还额外描述了顶点着色器的入口点函数、输入到管线中的顶点数据的布局；
- `primitive` 字段，`GPUPrimitiveState` 类型的 JavaScript 对象，描述图元装配的信息，默认是空对象；
- `depthStencil` 字段，`GPUDepthStencilState` 类型的 JavaScript 对象，是一个可选对象，描述深度模板测试信息；
- `multisample` 字段，`GPUMultisampleState` 类型的 JavaScript 对象，默认是一个空对象，描述管线的多重采样信息；
- `fragment` 字段，`GPUFragmentState` 类型的 JavaScript 对象，是一个可编程阶段，除了可编程阶段对象的属性外，还额外描述了片元着色器的入口点函数及如何输出片元颜色。如果它是 null，那么渲染管线就不会输出颜色，仅仅作为无颜色输出模式，一般这种管线只拿来作深度模板测试。



### 2.1.1 异步创建管线

除了通过设备对象的 `createRenderPipeline` 方法同步创建外，还可以通过设备对象的 `createRenderPipelineAsync` 对象来异步创建，它返回的是 resolve 值是渲染管线对象的一个 Promise，你可以在异步函数中调用 await 来获取它的 resolve 值，异步创建函数同样也用到 `GPURenderPipelineDescriptor` 参数对象。

### 2.1.2 如何验证 GPURenderPipelineDescriptor 合规性

满足下列所有条件即可：

- [验证顶点着色阶段对象的可编程属性是否有问题](#如何验证可编程阶段对象的合规性)
- [验证顶点着色阶段对象自己是否有问题](#如何验证顶点着色阶段对象 GPUVertexState 的合规性)
- 如果存在 descriptor.fragment 字段（不为 null）：
  - [验证片元着色阶段对象的可编程属性是否有问题](#如何验证可编程阶段对象的合规性)
  - [验证片元着色阶段对象自己是否有问题](#如何验证片元着色阶段对象的合规性)
  - 如果片元着色器中用到了 "sample_mask" 内置变量，那么 descriptor.multisample.alphaToCoverageEnable 要设为 false
- [验证图元拼装阶段对象是否有问题](#如何验证图元拼装阶段对象合规性)
- 如果 descriptor.depthStencil 不是 null，那么 [验证深度模板测试阶段对象是否有问题](#如何验证深度模板测试阶段对象的合规性)
- [验证多重采样阶段对象是否有问题](#如何验证多重采样阶段对象的合规性)
- 对于顶点着色器中用户自定义的出口，片元着色器必定要有与之对应的入口，到 wgsl 会介绍
- 对于片元着色器和片元着色器中自定义的组件（应该指的是通过 location 在两个着色器之间传递的总个数）的数量，要小于设备限制列表中的 `maxInterStageShaderComponents` 值。



## 2.2 图元拼装阶段

`GPURenderPipelineDescriptor` 对象里的 `primitive` 字段值，是一个 JavaScript Object。

``` web-idl
enum GPUPrimitiveTopology {
  "point-list",
  "line-list",
  "line-strip",
  "triangle-list",
  "triangle-strip"
};

enum GPUFrontFace {
  "ccw",
  "cw"
};

enum GPUCullMode {
  "none",
  "front",
  "back"
};

dictionary GPUPrimitiveState {
  GPUPrimitiveTopology topology = "triangle-list";
  GPUIndexFormat stripIndexFormat;
  GPUFrontFace frontFace = "ccw";
  GPUCullMode cullMode = "none";

  boolean clampDepth = false;
};
```

图元装配阶段对象是 `GPUPrimitiveState` 类型的，所有的参数均可选，它本身也是可选的。

- 参数 `topology`，`GPUPrimitiveTopology` 字符串枚举类型的值，表示顶点如何装配，默认是三角形列表 `"triangle-list"`，其余还有 三角带 `"triangle-strip"`、线列表 `"line-list"`、线带 `"line-strip"` 和单纯绘制 点 `"piont-list"`，与 WebGL 中 drawArray 的 mode 参数类似；
- 参数 `stripIndexFormat`，可选参数，若为索引三角形，则指定索引数值的数字类型，是一种字符串枚举类型 `GPUIndexFormat`，具体见顶点着色阶段中的 WebIDL 定义；
- 参数 `frontFace`，可选参数，默认值是 `"ccw"`，是一种字符串枚举类型 `GPUFrontFace`，指的是点构成三角形的旋绕方向，ccw 即逆时针，cw 即顺时针。
- 参数 `cullMode`，可选参数，默认值是 `"none"`，是一种字符串枚举类型 `GPUCullMode`，指的是剔除模式，除了 none 之外还有前剔除、背剔除；
- 参数 `clampDepth`，可选参数，默认值是 false，布尔类型，若启用则表示深度值会被截取；需要在请求设备对象时启用 `clamp-depth` 功能。



### 2.2.1 顶点索引格式 GPUIndexFormat

``` web-idl
enum GPUIndexFormat {
  "uint16",
  "uint32"
};
```

顶点索引格式，`GPUIndexFormat`，它决定了 VBO 中索引值的数据类型以及当图元拓扑为 "line-strip" 和 "triangle-strip" 时图元的 **重新起算值**。

**图元的重新起算值**（Primitive Restart Value），指示应从哪里重新开始算一个图元，而不是继续使用先前索引过的顶点来构造三角带。

[GPUPrimitiveState](#2.2 图元拼装阶段)，如果其 `"topology"` 字段指定了 "line-strip" 或 "triangle-strip"，那么它的 `"stripIndexFormat"` 字段也需要相应地设置，以便管线创建时可以用到图元重新起算值。

如果用的是 "triangle-list"、"line-list" 和 "point-list"，那么 `"stripIndexFormat"` 要设为 undefined，并要使用渲染通道编码器（GPURenderPassEncoder）的 `setIndexBuffer` 方法来设置索引。 

> 译者注
>
> 原文介绍 GPUIndexFormat 类型是在顶点着色阶段（Vertex State），笔者觉得此部分应摆在用到它的类型下更合适。
>
> `uint16` 代表重新起算值是 2byte（0xFFFF），即 2byte 才取一个索引数字；`uint32` 表示重新起算值是 4byte（0xFFFFFFFF），即 4byte 才取一个索引数字。



### 2.2.2 如何验证图元拼装阶段对象合规性

如果下列条件都满足，那么图元拼装阶段对象就是没问题的：

- 图元拼装阶段对象的 topology 字段是 "line-strip" 或 "triangle-strip"，那么 stripIndexFormat 不能是 undefined；topology 是其他的，stripIndexFormat 就必须是 undefined；
- 图元拼装阶段对象的 clampDepth 是 true，那么设备的功能列表要包括 "depth-clamp" 功能



### 2.2.3 代码举例

``` js
const renderPipeline = device.createRenderPipeline({
  /* ... */
  primitive: {
    topology: "triangle-list",
  }
})
```



## 2.3 顶点着色阶段

顶点着色阶段对象，是 `GPURenderPipelineDescriptor` 对象中 `vertex` 字段的值，是一个 JavaScript Object，要满足 `GPUVertexState` 类型（包括其父类型 GPUProgrammableStage）：

``` web-idl
dictionary GPUVertexState: GPUProgrammableStage {
	sequence<GPUVertexBufferLayout?> buffers = [];
};

dictionary GPUVertexBufferLayout {
  required GPUSize64 arrayStride;
  GPUVertexStepMode stepMode = "vertex";
  required sequence<GPUVertexAttribute> attributes;
};

enum GPUVertexStepMode {
  "vertex",
  "instance"
};
```

GPUVertexState 对象需要一个 buffers 字段，是 `GPUVertexBufferLayout` 对象的数组。

`GPUVertexBufferLayout` 对象，需要两个必选参数：

- `arrayStride`，unsigned longlong 类型，表示一个顶点包括的所有数据（坐标、颜色、法线、纹理坐标等）步幅有多大；
- `attributes`，一个数组，元素类型是 `GPUVertexAttribute` 的对象，描述这块顶点数据中有多少个 [顶点属性](#什么是顶点缓存（VertexBuffer）与顶点属性（GPUVertexAttribute）)；

还有一个可选参数，`GPUVertexStepMode` 字符枚举类型的字段 `stepMode`，默认值是 `"vertex"`；它表示如何访问顶点数据，它有两种值：

- "vertex"，表示无论渲染通道编码器发出几次绘制（draw 方法的 instanceCount 参数无论是几）指令，都不会从 VertexBuffer 的头部再重新开始读取顶点数据，而是基于第一次读取的末尾继续往下读；
- "instance"，表示即使渲染通道编码器发出绘制多次（draw 方法的 instanceCount 参数大于 1）的指令，在绘制完第一轮后（顶点着色器跑了一遍后），仍然从同一个 VertexBuffer 的起点开始获取顶点数据；



### 2.3.1 顶点缓存（VertexBuffer）与顶点属性（GPUVertexAttribute）

概念上说，顶点缓存是显存中顶点数据的一个描述视图，具体而言是一个数组，前一个数组元素和后一个数组元素之间的距离被称作 ArrayStride（单位：byte），也可以称之为元素的长度。

每一个元素，被称为一个顶点数据，它由若干个顶点属性（VertexAttribute）构成。每个顶点属性在顶点着色器中的 location 是独一无二的。

``` web-idl
dictionary GPUVertexAttribute {
  required GPUVertexFormat format;
  required GPUSize64 offset;
  required GPUIndex32 shaderLocation;
};
```

在 GPUVertexBufferLayout 对象的 attributes 数组中，每个元素即 GPUVertexAttribute 对象。

每个 GPUVertexAttribute 对象有三个必选参数：

- `format`，`GPUVertexFormat` 字符枚举类型，见下文 [顶点格式](#顶点格式 GPUVertexFormat)，确定某种顶点属性的数字类型、元素组成情况；
- `offset`，unsigned longlong 类型，指定它在每块顶点数据中的偏移量，单位 byte；
- `shaderLocation`，unsigned long 类型，指定它在 WGSL 顶点着色器中的 location 号。



### 2.3.2 顶点格式 GPUVertexFormat

``` web-idl
enum GPUVertexFormat {
  "uint8x2",
  "uint8x4",
  "sint8x2",
  "sint8x4",
  "unorm8x2",
  "unorm8x4",
  "snorm8x2",
  "snorm8x4",
  "uint16x2",
  "uint16x4",
  "sint16x2",
  "sint16x4",
  "unorm16x2",
  "unorm16x4",
  "snorm16x2",
  "snorm16x4",
  "float16x2",
  "float16x4",
  "float32",
  "float32x2",
  "float32x3",
  "float32x4",
  "uint32",
  "uint32x2",
  "uint32x3",
  "uint32x4",
  "sint32",
  "sint32x2",
  "sint32x3",
  "sint32x4",
};
```

上面 WebIDL 中顶点格式 `GPUVertexFormat` 枚举的每一个值中，有按顶点的组件类型（二三四维）、每个维度的数字类型两部分信息，其中有一些简写：

- `unorm` = 无符号归一化 u（unsigned） + 归一化 norm（normalized）
- `snorm` = 有符号归一化 s（signed）+ 归一化 norm（normalized）
- `uint` = 无符号整型
- `sint` = 有符号整型
- `float` = 浮点数

以常见的 "float32x3" 为例（注意那个 x 是小写字母的 X），表示某个顶点属性的数值类型是三个 float32 数字（不一定是坐标，也可以是其他的顶点属性（Vertex Attribute））。



### 2.3.3 代码举例

``` js
const renderPipeline = device.createRenderPipeline({
  /* ... */
  vertex: {
    module: device.createShaderModule({
      code: ` /* wgsl vertex shader code */ `,
    }),
    entryPoint: 'vertex_main',
    buffers: [
      {
        arrayStride: 4 * 5, // 一个顶点数据占 20 bytes
        attributes: [
          {
            // for Position VertexAttribute
            shaderLocation: 0,
            offset: 0,
            format: "float32x3" // 其中顶点的坐标属性占 12 字节，三个 float32 数字
          },
          {
            // for UV0 VertexAttribute
            shaderLocation: 1,
            offset: 3 * 4,
            format: "float32x2" // 顶点的纹理坐标占 8 字节，两个 float32 数字
          }
        ]
      }
    ]
  }
})
```

上面例子：

- 用到的 `GPUVertexFormat` 有 "float32x3"、"float32x2"；
- 一个顶点数据（块）长 20 bytes，即从一个顶点数据的头部前往下一个顶点数据的头部，需要 "stride" 20个字节；
- 对于排列在这块 VertexBuffer 中的某个顶点数据块中，有两个 `GPUVertexAttribute`，一个是坐标，紧接着第二个是二维纹理坐标，所以纹理坐标的数据应在顶点数据块的第 12 个字节开始起算（0~11字节是坐标的三个 float32 数字）

### 2.3.4 如何验证顶点缓存布局对象 GPUVertexBufferLayout 的合规性

设某个 GPUVertexBufferLayout 对象为 layout，当其符合以下条件即可：

- layout.arrayStride ≤ 设备限制列表中的 `maxVertexBufferArrayStride`，且为 4 的倍数
- 对于 layout.attributes 中的每个元素，令其为 attrib：
  - 若 layout.arrayStride 是 0，则：attrib.offset + sizeof(attrib.format) ≤ 设备限制列表中的 `maxVertexBufferArrayStride`
  - 否则 attrib.offset + sizeof(attrib.format) ≤ layout.arrayStride
  - attrib.offset 至少是 min(4, sizeof(attrib.format)) 的倍数
  - attrib.shaderLocation < 设备限制列表中的 `maxVertexAttributes`
- 对于顶点着色器代码中入口函数的每个顶点属性，layout.attributes 中的每个 GPUVertexAttribute 元素对象均要满足：
  - 着色器代码中的顶点属性变量类型，与 attrib.format 相比：
    - 当 attrib.format 是 "unorm"，"snorm" 或 "float" 其中的一种时，着色器代码中变量类型要是 `vecN<f32>` 或 `f32`
    - 当 attrib.format 是 "uint" 其中的一种时，着色器代码中变量类型要是 `vecN<u32>` 或 `u32`
    - 当 attrib.format 是 "sint" 其中的一种时，着色器代码中变量类型要是 `vecN<i32>` 或 `i32`
  - 着色器中顶点属性的 location 特性值要等于 attrib.shaderLocation

### 2.3.5 如何验证顶点着色阶段对象 GPUVertexState 的合规性

设某个 GPUVertexState 对象为 state，当其符合以下条件即可：

- state.buffers.length ≤ 设备限制列表中的 `maxVertexBuffers`
- state.buffers 中每个元素均要通过 [顶点缓存布局对象的合规性验证](#2.3.4 如何验证顶点缓存布局对象 GPUVertexBufferLayout 的合规性)
- state.buffers 数组的所有元素的 attributes 个数之和 ≤ 设备限制列表中 `maxVertexAttributes` 
- 所有 GPUVertexAttribute 顶点属性对象的 shaderLocation 要唯一



## 2.4 片元着色阶段

片元着色阶段对象，是 `GPURenderPipelineDescriptor` 对象中 `fragment` 字段的值，是一个 JavaScript Object，要满足 `GPUFragmentState` 类型（包括其父类型 GPUProgrammableStage）：

```web-idl
dictionary GPUFragmentState: GPUProgrammableStage {
	required sequence<GPUColorTargetState> targets;
};
```

- 参数 `targets` 是元素为 `GPUColorTargetState` 类型的对象的数组，是一个必须存在的参数，见 [2.6 颜色输出阶段](#2.6 颜色输出阶段)



### 如何验证片元着色阶段对象的合规性

设片元着色阶段 GPUFragmentState 对象为 state，其满足如下要求即可：

- state.targets.length ≤ 8
- state.targets 中每个元素，称之为 colorState：
  - colorState.format 必须是 [WebGPU Spec 24.1.1 纯色格式（Plain color formats）](https://www.w3.org/TR/webgpu/#plain-color-formats) 中标为 `RENDER_ATTACHMENT` 的一种
  - 若 colorState.blend 是 undefined：
    - colorState.format 要在 [WebGPU Spec 24.1.1 纯色格式（Plain color formats）](https://www.w3.org/TR/webgpu/#plain-color-formats)中选
    - colorState.blend.color、colorState.blend.alpha 必须是有效的
  - colorState.writeMask ≤ 16
  - 片元着色器入口函数有与 state.targets 中相匹配的输出 location，管线输出对象的类型要与 colorState.format 相对应，否则 colorState.writeMask 必须是 0

colorState.blend.color、colorState.blend.alpha 如何说是有效的？令它俩为 component，若 component.operation 是 "min" 或 "max"，那么 component.srcFactor 和 component.dstFactor 都必须是 "one" 即可。



### 举例

``` js
const renderPipeline = device.createRenderPipeline({
  /* ... */
  fragment: {
    module: device.createShaderModule({
      code: `/* wgsl fragment shader source code */`,
    }),
    entryPoint: "fragment_main",
    targets: [{
      format: "bgra8unorm"
    }]
  }
})
```



## 2.5 深度模板测试阶段

深度模板测试阶段对象，是 `GPURenderPipelineDescriptor` 对象中 `depthStencil` 字段的值，是一个 JavaScript Object，要满足 `GPUDepthStencilState` 类型：

``` web-idl
dictionary GPUDepthStencilState {
  required GPUTextureFormat format;

  boolean depthWriteEnabled = false;
  GPUCompareFunction depthCompare = "always";

  GPUStencilFaceState stencilFront = {};
  GPUStencilFaceState stencilBack = {};

  GPUStencilValue stencilReadMask = 0xFFFFFFFF;
  GPUStencilValue stencilWriteMask = 0xFFFFFFFF;

  GPUDepthBias depthBias = 0;
  float depthBiasSlopeScale = 0;
  float depthBiasClamp = 0;
};

dictionary GPUStencilFaceState {
  GPUCompareFunction compare = "always";
  GPUStencilOperation failOp = "keep";
  GPUStencilOperation depthFailOp = "keep";
  GPUStencilOperation passOp = "keep";
};

enum GPUStencilOperation {
  "keep",
  "zero",
  "replace",
  "invert",
  "increment-clamp",
  "decrement-clamp",
  "increment-wrap",
  "decrement-wrap"
};
```

由于官方这部分没有文字介绍，到后续有例子学习时再专门补充。



### 如何验证深度模板测试阶段对象的合规性

对于深度模板测试阶段 `GPUDepthStencilState` 对象，令其为 state，只需满足：

- state.format 是 [WebGPU Spec 24.1.2 深度模板格式（Depth/stencil format）](https://www.w3.org/TR/webgpu/#depth-formats) 中的一个；
- 若 state.depthWriteEnabled 是 true，或者 state.depthCompare 不是 "always"，那么 state.format 必须是有深度部分的格式
- 若 state.stencilFront 或 state.stencilBack 不是默认值，那么 state.format 必须是有模板部分的格式 



## 2.6 颜色输出阶段

颜色输出阶段对象，`GPUColorTargeState` 类型，是 `GPURenderPipelineDescriptor` 对象中 `fragment` 字段中 `targets` 这个数组字段中元素的类型。

``` web-idl
dictionary GPUColorTargetState {
  required GPUTextureFormat format;

  GPUBlendState blend;
  GPUColorWriteFlags writeMask = 0xF;  // GPUColorWrite.ALL
};
```

子类型：

``` web-idl
dictionary GPUBlendState {
  required GPUBlendComponent color;
  required GPUBlendComponent alpha;
};

typedef [EnforceRange] unsigned long GPUColorWriteFlags;
[Exposed=(Window, DedicatedWorker)]
namespace GPUColorWrite {
  const GPUFlagsConstant RED   = 0x1;
  const GPUFlagsConstant GREEN = 0x2;
  const GPUFlagsConstant BLUE  = 0x4;
  const GPUFlagsConstant ALPHA = 0x8;
  const GPUFlagsConstant ALL   = 0xF;
};
```



### 混合模式

``` web-idl
dictionary GPUBlendComponent {
  GPUBlendOperation operation = "add";
  GPUBlendFactor srcFactor = "one";
  GPUBlendFactor dstFactor = "zero";
};

enum GPUBlendFactor {
  "zero",
  "one",
  "src",
  "one-minus-src",
  "src-alpha",
  "one-minus-src-alpha",
  "dst",
  "one-minus-dst",
  "dst-alpha",
  "one-minus-dst-alpha",
  "src-alpha-saturated",
  "constant",
  "one-minus-constant"
};

enum GPUBlendOperation {
  "add",
  "subtract",
  "reverse-subtract",
  "min",
  "max"
};
```

由于官方这部分没有文字介绍，到后续有例子学习时再专门补充。



## 2.7 多重采样阶段

颜色输出阶段对象，`GPUMultisampleState` 类型，是 `GPURenderPipelineDescriptor` 对象中 `multisample` 字段的值。

``` web-idl
dictionary GPUMultisampleState {
  GPUSize32 count = 1;
  GPUSampleMask mask = 0xFFFFFFFF;
  boolean alphaToCoverageEnabled = false;
};
```

- 参数 `count`，采样次数，只能是 1 或者 4，默认值是 1；
- 参数 `mask`，采样遮罩值，类型是 unsigned long，默认值是 `0xFFFFFFFF`；
- 参数 `alphaToCoverageEnabled`，默认值是 false。

后面两个值，在 [WebGPU Spec 21.3.10 采样遮罩](https://www.w3.org/TR/webgpu/#sample-masking) 中会介绍它们的用途，采样遮罩值是 0 的片元将不会输出颜色，它由三个遮罩变量取逻辑与构成，其中一个 `shader-output-mask` 由片元着色器中的内置变量 `sample_mask` 决定，而这个内置变量又由此处的 alphaToCoverageEnabled、mask 值共同作用而成，此处为简略描述。



### 如何验证多重采样阶段对象的合规性

alphaToCoverageEnabled 若为 true，count 要大于 1.



### 代码举例

``` js
const renderPipeline = device.createRenderPipeline({
  /* ... */
  multisample: {
    count: 4
  }
})
```



## 2.8 综合代码举例

``` js
const renderPipeline = device.createRenderPipeline({
  layout: [/* GPURenderPipelineLayout[] */],
  vertex: { /* {}: GPUVertexState */ },
  fragment: { /* {}: GPUVertexState */ },
  primitive: { /* {}: GPUPrimitiveState */ },
  multisample: { /* {}: GPUMultisampleState */ }
})
```



# 3 计算管线

计算管线，`GPUComputePipeline` 类型，是一种能在计算通道编码器 `GPUComputePassEncoder` 中使用的管线，完成某个通用计算的过程。

计算管线的输入和输出在绑定组中绑定好了，并通过 `GPUPipelineLayout` 提供（详见资源绑定章节）。

它不像渲染管线一样有特别具体的输出结果，它的结果，将写入绑定组中 type 是 `"storage"` 的 buffer 和 type 是 `"write-only"` 的 storageTexture 的两种资源。

计算管线的阶段只有一个：计算着色器。

下面是计算管线的接口定义：

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUComputePipeline {
};
GPUComputePipeline includes GPUObjectBase;
GPUComputePipeline includes GPUPipelineBase;
```



## 计算管线的创建

设备对象的 `createComputePipeline` 可以创建一个计算管线，它需要一个 `GPUComputePipelineDescriptor` 类型的 JavaScript 对象作为参数。

``` web-idl
dictionary GPUComputePipelineDescriptor : GPUPipelineDescriptorBase {
	required GPUProgrammableStage compute;
};
```

GPUComputePipelineDescriptor 类型继承自 `GPUPipelineDescriptorBase` 类型，意味着也要遵循父类型的字段规则。

也可以通过设备对象的 `createComputePipelineAsync` 方法异步创建计算管线，语法与异步创建渲染管线一样，参数与同步创建计算管线一样。

## 如何验证 GPUComputePipelineDescriptor 参数对象的合规性

令 GPUComputePipelineDescriptor 对象名为 descriptor。

- descriptor.layout 与设备对象必须是有效的
- [验证计算着色阶段对象的可编程属性是否有问题](#如何验证可编程阶段对象的合规性)
- descriptor.compute 中计算着色器用到的工作组大小要不大于设备对象限制列表中的 `maxComputeWorkgroupStorageSize` 值，每个工作组用到的 invocation 要不大于设备对象限制列表中 `maxComputeInvocationsPerWorkgroup` 值；
- descriptor.compute 中计算着色器的 `workgroup_size` 特性的三个分量值都不能大于设备对象限制列表中的 `maxComputeWorkgroupSizeX`、`maxComputeWorkgroupSizeY`、`maxComputeWorkgroupSizeZ` 的值；

以上均通过的话，则可以返回一个正确的计算管线对象。

## 代码举例

``` js
const computePipeline = device.createComputePipeline({
  compute: {
    module: device.createShaderModule({
      code: `/* wgsl compute shader source code */`
    }),
    entryPoint: "main",
  }
})
```



# 4 译者注

这部分较长，有一部分我还没有实践，学习、翻译起来比较吃力。

但是浓缩起来，提炼主干看，只讲了下面四件事：

- 管线是什么，输入和输出是什么东西，如何创建的，有什么类型的管线
- 管线是由阶段构成的，其中有三个阶段（顶点着色、片元着色、通用计算）是可编程阶段
- 管线配套的绑定组布局、顶点缓存布局与着色器代码之间的坑位的连接规则
- 顶点着色阶段中非常重要的概念：VertexBuffer 和顶点属性

管线是 WebGPU 中执行一个完整的计算（或渲染，或通用计算）的最小单元，他有着自己的输入和输出。

你可以通过下一篇文章的通道编码器向其传递不同的 VertexBuffer 和 资源绑定组，但是通道编码器的作用可不仅仅是向管线设置数据那么简单，下文见。
