资源绑定，即 JavaScript 中（即 CPU 端）如何对待传递到 GPU 的数据进行组织、分配的一种设计。

为了完成这个过程（CPU到GPU），WebGPU 设计了几个对象用于管理这些数据，这些数据包括 某些GPUBuffer（例如UBO，但是不包括VBO）、GPUTexture、GPUSampler、存储型纹理、外部纹理五种，这几个对象是：

- 资源绑定组（以后均简称绑定组）- GPUBindGroup
- 资源绑定组布局（以后称为绑定组的布局对象）- GPUBindGroupLayout
- 管线布局 - GPUPipelineLayout

和规范中顺序略有不同，我按我上面这个来。

# 1 关系简易图解

```
     GPUBindGroup <--- 1 ---┓                动区
                    GPUBindGroupLayout   -----------
GPUPipelineLayout <--- N ---┛                静区
    |
    1
    ↓
GPUPipelineBase
```

简单的说就是绑定组有其布局，管线也有其布局；

绑定组的布局负责告诉资源长什么样子，管线的布局告诉管线着色器里头有多少类和分别有多少个资源坑位要进来；

两个布局负责沟通，那绑定组、管线就各司其职（一个负责组织管线所需的资源，一个负责某个渲染过程）。

# 2 资源绑定组 GPUBindGroup

资源绑定组，`GPUBindGroup`，一般会简单称之为“绑定组”，它组织了一些 **资源**，这些资源在某个具体的着色阶段一起起作用。

所谓的资源，就是 GPUBuffer、纹理、采样器等数据类型的对象。

## 如何创建

通过设备对象的 `createBindGroup` 方法创建，它需要一个必选的对象参数，这个对象参数要满足 `GPUBindGroupDescriptor` 类型。

``` web-idl
dictionary GPUBindGroupDescriptor : GPUObjectDescriptorBase {
  required GPUBindGroupLayout layout;
  required sequence<GPUBindGroupEntry> entries;
};
```

看得出 GPUBindGroupDescriptor 类型需要两个必选参数：

- 参数 `layout`，`GPUBindGroupLayout` 类型，通常称这个参数为资源绑定组的布局对象，有时候简单点就说对应的布局对象，下面会详细介绍这个类型；
- 参数 `entries`，一个数组，每个元素皆为 [GPUBindGroupEntry](#GPUBindGroupEntry 类型) 类型，具体解释见下文。

## GPUBindGroupEntry 类型

`GPUBindGroupEntry` 类型的对象，指代一种在着色阶段要用到的资源，包括一些简单的元数据。

这里的资源，在 WebGPU 中使用 `GPUBindingResource` 来定义。

``` web-idl
dictionary GPUBindGroupEntry {
  required GPUIndex32 binding;
  required GPUBindingResource resource;
};
```

`GPUBindGroupEntry` 对象的字段 `binding` 是一个 unsigned long 类型的数字，表示这个资源在着色器代码中的 `location`（在 WGSL 会介绍），即告诉着色器代码要从几号坑位取数据，一对一的。

而另一个字段 `resource` 自然指的就是这个下面要介绍的 `GPUBindingResource` 了。

### GPUBindingResource

有四种 **资源**：采样器、纹理（视图）、缓存、外部纹理。

``` web-idl
typedef (GPUSampler or GPUTextureView or GPUBufferBinding or GPUExternalTexture) GPUBindingResource;
```

常见的是前三种，第四种通常用于视频类型的纹理，有兴趣了解的读者可自行查阅纹理部分的章节。

第一种和第二种还比较好理解，在采样器和纹理章节能了解到如何创建，第三种并不是 GPUBuffer 的直接传递，而是嵌套了个对象，是 `GPUBufferBinding` 类型的，见下文：

### GPUBufferBinding

```  web-idl
dictionary GPUBufferBinding {
  required GPUBuffer buffer;
  GPUSize64 offset = 0;
  GPUSize64 size;
};
```

到这里就有熟悉的类型了，即 `GPUBuffer`；

除此之外还有另外两个字段， `offset` 和 `size`，前者默认值是 0，表示要从 GPUBuffer 的第几个字节开始，后者则为要从 GPUBuffer 的 offset 处向后取多少个字节。

## 译者注

通过 GPUBindGroup，明确地把一堆资源挨个（每个 entry）合并打包在一个组里，并且是按顺序（参数 binding）组织在一起。这就好比做菜时的食材，按顺序罗列在灶台边，做这道菜的是一组（绑定组），做另一道菜的是另一组（绑定组）。

## 举例

``` js
const bindGroup = device.createBindGroup({
  layout: myBindGroupLayout, // 这个下面会介绍，这里假装已经有了
  entries: [
    /* ... */
  ]
})
```

### ① 采样器资源

``` js
entries: [
  {
    binding: 0,
    resource: device.createSampler({ /* ... */ })
  },
  /* ... */
]
```

### ② 纹理（视图）资源

``` js
entries: [
  /* ... */,
  {
    binding: 1,
    resource: myTexture.createView()
  },
  /* ... */
]
```

### ③ GPUBuffer 资源

``` js
entries: [
  /* ... */
  {
    binding: 2,
    resource: {
      buffer: uniformBuffer, // 通常通过绑定组传递的是 UBO，不绝对,
      size: 16
    }
  }
]
```



## 创建要遵守的规则

- descriptor.layout 字段必须是一个有效的布局对象
- descriptor.layout 对象的 entries 数量必须与 descriptor.entries 的数量一致

对于每个 descriptor.entries 中的 `GPUBindGroupEntry` （此处以 bindEntry 指代）来说：

- 此 bindEntry 的 binding 数字必须与 descriptor.layout 中的某一个一致，也即一一对应关系
- 如果 descriptor.layout.entries 中的某个 `GPUBindGroupLayoutEntry` 对象：
  - 有 sampler 字段，那么 bindEntry.resource 就必须是一个有效的 GPUSampler，而且此 GPUBindGroupLayoutEntry 的 sampler 字段的 type 属性
    - 是 `"filtering"`，那么 bindEntry.resource 这个 GPUSampler 就不能是比较型采样器（即 `isComparison` 这个内部变量是 false）；
    - 是 `"non-filering"`，那么 bindEntry.resource 这个 GPUSampler 既不能是比较型采样器，其 `isFiltering` 内部属性也不能是 true；
    - 是 `"comparison"`，那么 bindEntry.resource 这个 GPUSampler 就必须是比较型采样器（即 `isComparison` 内部属性是 true）
  - 有 texture 字段，那么 bindEntry.resource 必须是一个有效的 `GPUTextureView`，且此 GPUBindGroupLayoutEntry 的
    - texture 字段的 viewDimension 属性必须与 bindEntry.resource 这个 GPUTextureView 的 dimension 一致；
    - texture 字段的 sampleType 属性与 bindEntry.resource 这个 GPUTextureView 的 format 兼容；令 bindEntry.resource 这个 GPUTextureView 原本的纹理对象为 T，此时 T 的 usage 必须包括 `"TEXTURE_BINDING"`；
    - texture 字段的 multisampled 属性是 true，那么上一条设定的纹理对象 T 的 sampleCount 必须大于1，否则 T.sampleCount 必须是 1.
  - 有 storageTexture 字段，那么 bindEntry.resource 必须是一个有效的 `GPUTextureView` 对象，此时令 T 为 bindEntry.resource 这个 GPUTextureView 对象原本的纹理对象：
    - 此 storageTexture 字段的 viewDimension 必须与 bindEntry.resource 这个 GPUTextureView 的 dimension 一致；
    - 此 storageTexture 字段的 format 必须与 bindEntry.resource 这个 GPUTextureView 的创建参数（GPUTextureViewDescriptor，创建完成后被内置，JavaScript 看不到）的 format 参数一致；
    - T 对象的 usage 必须包括 `"STORAGE_BINDING"`；
  - 有 buffer 字段，那么 bindEntry.resource 必须是一个 `GPUBufferBinding` 对象，且 bindEntry.resource.buffer 必须是一个有效的 `GPUBuffer` 对象，不妨令这个 GPUBuffer 对象为 B 对象，且此 buffer 字段的 type 是：
    - `"uniform"`，那么 B.usage 必须包括 `"UNIFORM"`，且 bindEntry.resource.size 必须小于等于设备限制列表中的 maxUniformBufferBindingSize 值，bindEntry.resource.offset 必须是设备限制列表中 minUniformBufferOffsetAlignment 的倍数
    - `"storage"` 或 `"read-only-storage"`，B.usage 必须包括 `"STORAGE"`，且 bindEntry.resource.size 小于等于设备限制列表中的 maxStorageBufferBindingSize，bindEntry.resource.offset 必须是设备限制列表中的 minStorageBufferOffsetAlignment 的倍数

满足以上要求后，基本上绑定组对象就能创建成功，仍有一些可能不常用的细节需要读者自行查阅文档。



# 3 资源绑定组的布局 GPUBindGroupLayout

一个资源绑定组的布局对象，是 `GPUBindGroupLayout` 类型，简称绑定组的布局（对象），它的作用是联系与它配套的绑定组和对应阶段的着色器，告诉管线在什么着色阶段传入的数据长什么样子，是何种类。

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUBindGroupLayout {
};
GPUBindGroupLayout includes GPUObjectBase;
```

## 如何创建

调用设备对象的 `createBindGroupLayout` 方法，即可创建一个绑定组布局对象。

此方法需要一个参数对象，需符合 `GPUBindGroupLayoutDescriptor` 类型：

```web-idl
dictionary GPUBindGroupLayoutDescriptor : GPUObjectDescriptorBase {
	required sequence<GPUBindGroupLayoutEntry> entries;
};
```

它只有一个必选成员 `entries`，是一个数组，数组的每个元素是 `GPUBindGroupLayoutEntry` 类型的对象。

### GPUBindGroupLayoutEntry 类型

`GPUBindGroupLayoutEntry` 描述一个在着色器中能被访问到的资源长什么样子，且如何找到它。

``` web-idl
typedef [EnforceRange] unsigned long GPUShaderStageFlags;
[Exposed=(Window, DedicatedWorker)]
namespace GPUShaderStage {
  const GPUFlagsConstant VERTEX   = 0x1;
  const GPUFlagsConstant FRAGMENT = 0x2;
  const GPUFlagsConstant COMPUTE  = 0x4;
};

dictionary GPUBindGroupLayoutEntry {
  required GPUIndex32 binding;
  required GPUShaderStageFlags visibility;

  GPUBufferBindingLayout buffer;
  GPUSamplerBindingLayout sampler;
  GPUTextureBindingLayout texture;
  GPUStorageTextureBindingLayout storageTexture;
  GPUExternalTextureBindingLayout externalTexture;
};
```

可见，`GPUBindGroupLayoutEntry` 接受两个必选参数：

- 参数 `binding`，unsigned long 类型的数字，指定该 entry（也即资源）绑定号，绑定号在一个绑定组布局对象的 entries 数组所有元素中是唯一的，且必须和绑定组中的 entry 有对应，以便于在 WGSL 代码中访问对应资源；
- 参数 `visibility`，`GPUShaderStageFlags` 类型，需从 `GPUShaderStage` 中访问枚举值，表示该 entry 在什么着色阶段可见，例如指定 `visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT`，就意味着这个 entry 所描述的资源在顶点着色阶段和偏远着色阶段均可见。最后一个 `COMPUTE` 是计算管线的计算阶段。

还必须接受一个键值对作为此 entry 描述的资源的信息对象，需从 `buffer`、`sampler`、`texture`、`storageTexture` 和 `externalTexture` 中选一个。

### 描述缓存对象：GPUBufferBindingLayout

``` web-idl
enum GPUBufferBindingType {
  "uniform",
  "storage",
  "read-only-storage",
};

dictionary GPUBufferBindingLayout {
  GPUBufferBindingType type = "uniform";
  boolean hasDynamicOffset = false;
  GPUSize64 minBindingSize = 0;
};
```

绑定组传递的 GPUBuffer 只有两种，UBO（即 `"uniform"` 类型的 GPUBuffer）和存储型 GPUBuffer，其中后者又分存储型（`"storage"`）和只读存储型（`"read-only-storage"`）两小种，通过 `type` 字段标识，默认值是 "uniform"，type 字段只能是 GPUBufferBindingType 枚举中的一个。

`hasDynamicOffset` 表示缓存对象是否有动态偏移值，默认是 false；

`minBindingSize` 表示的是被绑定的缓存对象的最小绑定大小，默认是 0（byte）；

因为 type 的默认值是 "uniform"，所以如果你准备创建一个绑定组，并考虑到有 ubo 的传递，那么其实可以对某个 entry 简写成：

``` js
const layout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: {} // <- UBO 的简写
    }
  ]
})
```



### 描述采样器对象：GPUSamplerBindingLayout

``` web-idl
enum GPUSamplerBindingType {
  "filtering",
  "non-filtering",
  "comparison",
};

dictionary GPUSamplerBindingLayout {
	GPUSamplerBindingType type = "filtering";
};
```

绑定组布局对象中，用于描述对应绑定组中的采样器资源时用的是 `GPUSamplerBindingLayout` 对象，它只有一个 `type` 字段，其类型是枚举类型 `GPUSamplerBindingType`，默认值是 `"filtering"`。

它用来指示采样器的类型：过滤型、非过滤型和比较型。



### 描述纹理对象：GPUTextureBindingLayout

``` web-idl
enum GPUTextureSampleType {
  "float",
  "unfilterable-float",
  "depth",
  "sint",
  "uint",
};

dictionary GPUTextureBindingLayout {
  GPUTextureSampleType sampleType = "float";
  GPUTextureViewDimension viewDimension = "2d";
  boolean multisampled = false;
};
```

纹理对象（或者说其纹理视图对象，因为绑定组构造所需的是纹理视图对象）在绑定组的布局对象中以 `GPUTextureBindingLayout` 类型的 entry 表示，有三个参数：

- `samplerType`，是枚举类型 `GPUTextureSampleType` 的字段，默认值是 `"float"`，表示采样类型，有浮点、有符号/无符号整数、非过滤浮点、深度等几个可选项；
- `viewDimension`，是枚举类型 `GPUTextureViewDimension` 的字段，默认值是 `"2d"`，即默认绑定组中对应 binding 号的纹理视图 entry 所绑定的纹理视图资源是二维的；
- `multisampled`，布尔值，默认值是 false，表示绑定组中对应 entry 所绑定的纹理视图资源是否需要多重采样。



### 描述存储型纹理对象：GPUStorageTextureBindingLayout

``` web-idl
enum GPUStorageTextureAccess {
	"write-only",
};

dictionary GPUStorageTextureBindingLayout {
  GPUStorageTextureAccess access = "write-only";
  required GPUTextureFormat format;
  GPUTextureViewDimension viewDimension = "2d";
};
```

存储型纹理对象在绑定组的布局对象中以 `GPUStorageTextureBindingLayout` 类型的 entry 表示，有一个必选参数：

- `format`，类型是 `GPUTextureFormat` 枚举，不展开，如有需要请查阅纹理章节；

还有两个其他的参数：

- `access`，`GPUStorageTextureAccess` 枚举类型，默认值是 `"write-only"`，目前只能是只写类型（笔者注：不清楚为何这样设计），表示存储型纹理的可访问性；
- `viewDimension`，`GPUTextureViewDimension` 枚举类型，默认值是 `"2d"`，用于描述纹理视图对象（对应的纹理对象）的维度，默认是二维纹理



### 描述外部纹理对象：GPUExternalTextureBindingLayout

``` web-idl
dictionary GPUExternalTextureBindingLayout {
};
```

若需要传递外部纹理对象（视频类的纹理），则需要用到此对象。

它不需要参数，如果绑定组中存在 `GPUExternalTexture`，只需在此绑定组布局中写一个 entry，其 `externalTexture` 键指定一个空对象即可。



## GPUBindGroupLayoutDescriptor 的正确用法

- entries 数组中每个 entry 的 binding 是唯一的；
- 每个 entry 必须符合设备对象的功能限制列表中有关的参数项；

对于每个 entry，不妨设 buffer 型的 `entry.buffer` 对象名称为 `bufferLayout`，同理 sampler、texture、storage 的 entry 也有 `samplerLayout`、`textureLayout`、`storageTextureLayout`：

- `bufferLayout`、`samplerLayout`、`textureLayout`、`storageTextureLayout` 不是 undefined
- 若 entry.visibility 是 `VERTEX`：
  - bufferLayout.type 不能是 "storage"
  - storageTextureLayout.access 不能是 "write-only" （似乎此处有问题，待官方更新标准文档）
- 若 entry 是 texture 类型的，即 textureLayout 不是 undefined，且 textureLayout.multisampled 是 true：
  - textureLayout.viewDimension 必须是 "2d"
  - textureLayout.sampleType 不能是 "float" 和 "depth"
- 若 entry 是 storageTexture 类型的：
  - storageTextureLayout.viewDimension 不能是 "cube" 和 "cube-array"
  - storageTextureLayout.format 必须是存储型的格式

## 绑定组布局对象之间的比较：绑定组布局的等价

当下列条件满足时，两个 GPUBindGroupLayout 对象可视作等价：

- 内部属性 `exclusivePipeline` 一致（这个在 js 中看不到）
- 对于任意 entry 的 binding 值，下列二者满足一个：
  - 布局对象的内部属性 `"entryMap"` 中都没有此 binding 值
  - 布局对象的内部属性 `"entryMap"` 中两个 binding 值相等

如果两个绑定组等价，那么它们能调配的资源其实是一样的。



## 举例

### ① 普通的绑定组布局

这个有一个采样器，一个纹理，都只在片元着色阶段可见。

``` js
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      /* use for sampler */
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: {
        type: 'filtering',
      },
    },
    {
      /* use for texture view */
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      texture: {
        sampleType: 'float'
      }
    }
  ]
})
```

### ② 计算管线的绑定组布局

三个都是计算着色阶段可见，且都是 buffer 类型的 GPUBindGroupLayoutEntry。

``` js
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage"
      }
    },
    {
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage"
      }
    },
    {
      binding: 2,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage"
      }
    }
  ]
});
```



# 4 管线布局 GPUPipelineLayout

管线布局定义了一种在指令编码时通过 `setBindGroup` 方法来设置具体的某个绑定组与某种通道编码器（GPURenderPassEncoder 或 GPUComputePassEncoder）通过 `setPipeline` 方法设置的管线中的着色器之间的映射关系。

这句话咋看很长很长，说白了就是通道编码器通过其 `setBindGroup` 和 `setPipeline` 方法分别设置绑定组和管线后，那么绑定组所指的资源就能映射到管线中的着色器里，进而能在着色器里用传入的资源了。

一种资源（GPUBuffer、纹理、采样器等）在着色器中通过三个特性共同定位：

- 着色器的阶段（顶点、片元或计算，阶段来指定资源在哪个阶段的可见性）
- 绑定组id（即 setBindGroup 方法的参数，着色器中特性名是 group）
- 绑定id（即 entry 的 binding 属性，着色器中特性名是 bind）

三者共同构成一种资源在着色器中的地址，这个地址又可以称作管线的 **绑定空间（binding space）**。

这个地址，也即绑定空间，必须比着色器中用到的要多，否则就会出现在着色器中有，但是在绑定组却找不到对应的资源的情况。

管线布局对象的接口很简单：

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUPipelineLayout {
};
GPUPipelineLayout includes GPUObjectBase;
```

对多数渲染管线（GPURenderPipeline）或计算管线（GPUComputePipeline）使用同一个管线布局，就能保证在切换管线时，不需要对资源进行重新资源绑定。来看下面的例子：

设有计算管线 X 和 Y，它们分别用 XPL 和 YPL 管线布局来创建；而 XPL 和 YPL 又分别使用 A、B、C 和 A、D、C 绑定组布局对象来创建。

不妨设指令编码队列有两个调度（略超此部分的内容，要看计算管线部分内容）过程：

``` 
setBindGroup(0, ...)
setBindGroup(1, ...)
setBindGroup(2, ...)
setPipeline(X)
dispatch(...)
// 注意绑定组和管线的设置循序
setBindGroup(1, ...)
setPipeline(Y)
dispatch()
```

在这种情况下，开发者无需修改管线布局中的绑定组布局，而只需要修改管线与绑定组即可完成不同的调度计算。

> 乍一看很抽象，但是这正好符合 WebGPU 的设计哲学（嗯，这句话很装杯...）
>
> 实际也是如此，能在逻辑端好好组织好高度可复用的数据组织方式，让 GPU 能好好地按顺序横扫千军，是很舒服的事情。
>
> 绑定组代表的是资源，是数据实体；而管线、管线布局、绑定组布局则是描述信息和行为。为了完成两件不同的任务（管线的作用），或许在某一部分数据要求上略有不同（譬如 XPL 和 YPL 这俩管线布局中的第二个绑定组布局的不同，分别是 B 和 D），但是大部分是可复用的，譬如 A 和 C 绑定组布局。
>
> 所以上述代码中，完成了 X 的任务后，紧接着先切换 1 号槽位的绑定组，然后再切换 Y 管线，现在 Y 管线就复用了 A 和 C 绑定组布局，此时并没有修改 0 和 2 号槽位的绑定组，仅仅再次修改了 1 号槽位的绑定组，以对应 Y 管线不同的绑定组布局，大大减少了 CPU 端组织数据的开销。

注意，通常管线中最频繁切换的绑定组置于布局的顶部，换句话说，最不频繁改动的绑定组应放在底部（索引为 0 那端）。如果在绘图调用中某个绑定组变化得很多，那么最好把它拉到布局的顶部（栈顶），以减小 CPU 开销。

## 如何创建

管线布局通过调用设备对象的 `createPipelineLayout` 方法即可创建。

此方法需要一个 `GPUPipelineLayoutDescriptor` 类型的对象参数：

``` web-idl
dictionary GPUPipelineLayoutDescriptor : GPUObjectDescriptorBase {
	required sequence<GPUBindGroupLayout> bindGroupLayouts;
};
```

它有一个必选字段 bindGroupLayouts，是一个 `GPUBindGroupLayout` 数组。

## 创建要遵守的规则

- descriptor.bindGroupLayouts 的个数必须不大于设备限制列表中的 maxBindGroups 值
- 所有绑定组及其布局对象不得超过设备限制列表中有关绑定限制

注意，如果俩管线布局的绑定组布局对象数组是 **等效组**，那么它俩可以视作等效。

等效组的概念在绑定组小节有介绍。

## 举例

``` js
const pipelineLayout = device.createPipelineLayout({
  bindGroupLayouts: [bindGroupLayout],
})
```

计算管线的差不多。



## 译者废话

一个管线布局对象包含 N 个绑定组布局对象。



# 5 联动

创建绑定组，需要绑定组布局

创建管线布局，也需要绑定组布局

```
     GPUBindGroup <--- 1 ---┓
                    GPUBindGroupLayout
GPUPipelineLayout <--- N ---┛
```

创建管线的时候，只需要一个管线布局：

``` 
     GPUBindGroup <--- 1 ---┓                动区
                    GPUBindGroupLayout   -----------
GPUPipelineLayout <--- N ---┛                静区
    |
    1
    ↓
GPUPipelineBase
```

即是说，管线、管线布局、绑定组布局可以事先设计、安排好，创建、组合完毕就尽可能别动它们了，你只需认真地负责组织起绑定组，并使用通道编码器的 setBindGroup 设置绑定组即可。

## 偷懒

不指定 pipeline 创建时的参数对象的 layout 值（即管线布局），随后在创建 pipeline 后调用其 `getBindGroupLayout` 方法，从着色器中推断出绑定组布局对象，然后直接拿它来创建绑定组也是可以的，下面以计算管线为例：

``` js
const computePipeline = device.createComputePipeline({
  compute: {
    module: shaderModule,
    entryPoint: "main"
  }
});

const bindGroup = device.createBindGroup({
  layout: computePipeline.getBindGroupLayout(0),
  /* ... */
})
```

