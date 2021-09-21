# WebGPU 中的缓存对象：GPUBuffer

`GPUBuffer` 表示一块显存。显存中的数据是线性排列的，也就是可以通过偏移量来寻找显存中的数据。有些 GPUBuffer 可以被映射，被映射后的 GPUBuffer 可以通过 JavaScript 中的 ArrayBuffer 访问。

GPUBuffer 可以用 `GPUDevice.createBuffer(descriptor)` 来创建。

``` web-idl
[Exposed=(Window, DedicatedWorker), SecureContext]
interface GPUBuffer {
  Promise<undefined> mapAsync(GPUMapModeFlags mode, optional GPUSize64 offset = 0, optional GPUSize64 size);
  ArrayBuffer getMappedRange(optional GPUSize64 offset = 0, optional GPUSize64 size);
  undefined unmap();

  undefined destroy();
};
GPUBuffer includes GPUObjectBase;
```

`GPUBuffer` 对象有如下几个方法：

- mapAsync，即异步映射方法；
- getMappedRange，获取映射后的范围，以 ArrayBuffer 表示；
- unmap，取消映射；
- destroy，销毁并回收此 GPUBuffer 指向的显存

GPUBuffer 对象是可以被序列化的。

# 1 创建

创建一个 GPUBuffer 需要用到 `GPUBufferDescriptor` 类型的对象。

``` web-idl
dictionary GPUBufferDescriptor : GPUObjectDescriptorBase {
  required GPUSize64 size;
  required GPUBufferUsageFlags usage;
  boolean mappedAtCreation = false;
};
```

对于设备对象和 descriptor 对象，是有要求的：

- 如果设备对象丢失，那就无效；

- 如果 descriptor.usage 不在设备对象允许的用途之内，也无效；

- 如果 descriptor.usage 被同时设为 `MAP_READ` 和 `MAP_WRITE`，无效（即一个 GPUBuffer 不能同时用于映射独写）；

- 如果 descriptor.usage 被设为 `MAP_READ`，那么联合的用法只能是 `COPY_DST`；

- 如果 descriptor.usage 被设为 `MAP_WRITE`，那么联合的用法只能是 `COPY_SRC`；

- 如果 descriptor.mappedAtCreation 被设为 `true`，那么 descriptor.size 必须是 4 的倍数。

  

注意，descriptor.usage 既不是 `MAP_READ` 也不是 `MAP_WRITE` 时，将 descriptor.mappedAtCreation 设为 `true` 是可以的。

descriptor 的 size 属性指定了需要申请多大的显存，单位是 byte。




## GPUBuffer 的用途

使用 `GPUBufferUsage` 来标识 GPUBuffer 对象的用途。

``` web-idl
typedef [EnforceRange] unsigned long GPUBufferUsageFlags;
[Exposed=(Window, DedicatedWorker)]
namespace GPUBufferUsage {
  const GPUFlagsConstant MAP_READ      = 0x0001; // 映射并用来独取
  const GPUFlagsConstant MAP_WRITE     = 0x0002; // 映射并用来写入
  const GPUFlagsConstant COPY_SRC      = 0x0004; // 可以作为拷贝源
  const GPUFlagsConstant COPY_DST      = 0x0008; // 可以作为拷贝目标
  const GPUFlagsConstant INDEX         = 0x0010; // 索引缓存
  const GPUFlagsConstant VERTEX        = 0x0020; // 顶点缓存
  const GPUFlagsConstant UNIFORM       = 0x0040; // Uniform 缓存
  const GPUFlagsConstant STORAGE       = 0x0080; // 仅存储型缓存
  const GPUFlagsConstant INDIRECT      = 0x0100; // 间接使用
  const GPUFlagsConstant QUERY_RESOLVE = 0x0200; // 用于查询
};
```

用得比较多的是前 8 种。



# 2 缓存映射

JavaScript 可以对 GPUBuffer 对象进行映射操作，然后才能访问对应的显存。一旦 GPUBuffer 对象被映射，就可以调用其 `getMappedRange` 方法获取可被操作的显存，以 ArrayBuffer 表示。

进入映射状态的 GPUBuffer 对象所申请的那块显存不能被 GPU 使用，必须在提交给队列之前调用其 `unmap` 方法解除映射。

``` web-idl
typedef [EnforceRange] unsigned long GPUMapModeFlags;
[Exposed=(Window, DedicatedWorker)]
namespace GPUMapMode {
  const GPUFlagsConstant READ  = 0x0001;
  const GPUFlagsConstant WRITE = 0x0002;
};
```



## 异步映射：mapAsync 方法

异步地映射 GPUBuffer 申请那块显存，它的返回的无定义的 Promise，或者你可以直接使用 await 语法等待其映射完成。

它有三个参数：

- `mode`，`GPUMapMode` 类型，表示映射之后用来干什么，这个是必选参数
- `offset`，unsigned longlong 类型，表示从哪里开始映射，字节数量，默认是 0，必须是 8 的倍数
- `size`，unsigned longlong 类型，表示映射多少大小，字节数量，默认是 GPUBuffer 申请显存的大小减去 offset 的差，必须是 4 的倍数

注意，mode 要与 GPUBuffer 的 usage 一致且只能二选一，且调用此方法之前 GPUBuffer 要未映射。



## 获取映射的缓存：getMappedRange 方法

它能返回一个 ArrayBuffer，即 GPUBuffer 申请那块显存的 CPU 端表达。

它有两个参数：

- `offset`，可选参数，表示从申请的显存的哪个字节开始获取，如果不给就是 0；必须是 8 的倍数且不超申请的大小；
- `size`，可选参数，表示要多长，如果不给就是申请的显存的最大值减去 offset 的差；是 4 的倍数。

注意，这个方法要在 GPUBuffer 映射的时候才能用。



## 解除映射：unmap 方法

调用后 GPUBuffer 对象所申请的显存就可以再被 GPU 使用了。

> 注意，当一个 `MAP_READ` 类型的且在创建时没设为映射的 GPUBuffer 被取消映射时，它所对应的 ArrayBuffer 上的所有修改都会无效。



关于为什么要显存的映射/取消映射，以后会出专门的一篇文章介绍。



# 常见用例

## ① 创建 UBO

``` js
const uniformBuffer = device.createBuffer({
  size: 16,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})
```

COPY_DST 通常就意味着有数据会复制到此 GPUBuffer 上，这种 GPUBuffer 可以通过 `queue.writeBuffer` 方法写入数据：

``` js
const color = new Float32Array([0, .5, 0, 1])
device.queue.writeBuffer(
  uniformBuffer, // 传给谁
  0, 
  color.buffer, // 传递 ArrayBuffer
  color.byteOffset, // 从哪里开始
  color.byteLength // 取多长
)
```



## ② 创建映射读/映射写型的 GPUBuffer

``` js
const myMapReadBuffer = device.createBuffer({
  usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  size: 1000,
});
const myMapWriteBuffer = device.createBuffer({
  usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
  size: 1000,
});
```

`MAP_WRITE` 类型（映射写）的 GPUBuffer，它可以直接对其 ArrayBuffer 进行写入类型数组完成数据传递：

``` js
const gpuBuffer = device.createBuffer({
  mappedAtCreation: true,
  size: 4,
  usage: GPUBufferUsage.MAP_WRITE
});
const arrayBuffer = gpuBuffer.getMappedRange();

// 通过 TypedArray 向 ArrayBuffer 写数据
new Uint8Array(arrayBuffer).set([0, 1, 2, 3]);
```

同理，映射读 `MAP_READ` 类型的 GPUBuffer，自然也可以用 ArrayBuffer 读取数据。



## ③ 复制目标/复制源类型的 GPUBuffer

即 `COPY_DST` 和 `COPY_SRC` 类型，这俩和映射读/映射写有什么区别呢？

映射读/映射写 即 `MAP_READ` / `MAP_WRITE` 类型的意味着在拼装阶段可以通过 JavaScript 来写入和独取映射后的 GPUBuffer。

复制目标和复制源指的是一个 Pipeline（后续会讲到）中，这块 GPUBuffer 所申请的显存的用途，被标记为 `COPY_DST` 的，可以被指令编码器通过 `copyBufferToBuffer` 方法进行复制操作：

``` js
// 获取一块状态为映射了的显存，以及一个对应的 arrayBuffer 对象来写数据
const gpuWriteBuffer = device.createBuffer({
  mappedAtCreation: true,
  size: 4,
  usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC // 👈 注意这里
});
const arrayBuffer = gpuWriteBuffer.getMappedRange();

// 通过 TypedArray 向 ArrayBuffer 写数据
new Uint8Array(arrayBuffer).set([0, 1, 2, 3]);

// 解除显存对象的映射，稍后它就能在 GPU 中进行复制操作
gpuWriteBuffer.unmap();

// 创建一个新的状态为未映射的 GPUBuffer，它之后要拿来读取数据
const gpuReadBuffer = device.createBuffer({
  size: 4,
  usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ // 👈 注意这里
});

// 创建一个名为 copyEncoder 的指令编码器，用来复制显存
const copyEncoder = device.createCommandEncoder();
copyEncoder.copyBufferToBuffer(
  gpuWriteBuffer /* 源显存（对象） */,
  0 /* 起始字节（从哪开始读） */,
  gpuReadBuffer /* 目标显存（对象） */,
  0 /* 起始字节（从哪开始写） */,
  4 /* 大小 */
);

// 提交我们写好的复制功能的指令
const copyCommands = copyEncoder.finish();
device.queue.submit([copyCommands]);
```

除了 指令编码器的 `copyBufferToBuffer` 方法外，① 中提到的队列对象的 `writeBuffer` 也可以写入数据。

注：映射读/映射写/复制目标/复制源 通常会搭配使用，在注意他们的功能区别和作用方法即可。



## ④ 创建 VBO

``` js
const vbo = device.createBuffer({
  size: vbodata.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true // 创建时立刻映射，让 CPU 端能读写数据
})
```

VBO 要通过 passEncoder 的 setVertexBuffer 方法写入数据。

有时候还要配合 `GPUBufferUsage.INDEX` 即索引缓存来使用。



## ⑤ 创建存储型缓存对象

一般使用 `STORAGE` 用途的 GPUBuffer，是在计算管线中。

``` js
// 第一个矩阵
const firstMatrix = new Float32Array([
  2 /* 2行 */, 4 /* 4列 */,
  1, 2, 3, 4,
  5, 6, 7, 8
]);
const gpuBufferFirstMatrix = device.createBuffer({
  mappedAtCreation: true,
  size: firstMatrix.byteLength,
  usage: GPUBufferUsage.STORAGE,
});
const arrayBufferFirstMatrix = gpuBufferFirstMatrix.getMappedRange();
new Float32Array(arrayBufferFirstMatrix).set(firstMatrix);
gpuBufferFirstMatrix.unmap();

// 第二个矩阵，略，大致同第一个矩阵，数据不太一样

// 结果矩阵
const resultMatrixBufferSize = Float32Array.BYTES_PER_ELEMENT * (2 + firstMatrix[0] * secondMatrix[1]);
const resultMatrixBuffer = device.createBuffer({
  size: resultMatrixBufferSize,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
});
```

## `queue.writeBuffer` 和 `commandEncoder.copyBufferToBuffer` 异同

相同点都是向 GPUBuffer 写入数据，看它俩的定义：

``` web-idl
undefined copyBufferToBuffer(
  GPUBuffer source,
  GPUSize64 sourceOffset,
  GPUBuffer destination,
  GPUSize64 destinationOffset,
  GPUSize64 size);
  
undefined writeBuffer(
  GPUBuffer buffer,
  GPUSize64 bufferOffset,
  [AllowShared] BufferSource data,
  optional GPUSize64 dataOffset = 0,
  optional GPUSize64 size);
```

不同点：

- writeBuffer 是使用 ArrayBuffer 或 ArrayBufferLike（TypedArray等）作为数据源，且要求 GPUBuffer 是映射的，必须是 `COPY_DST`；
- copyBufferToBuffer 是 GPUBuffer 之间的复制，需要 `COPY_DST` 和 `COPY_SRC` 类型的 GPUBuffer；
- writeBuffer 方法是队列上开启一个“任务”，而 copyBufferToBuffer 是指令编码器的一个操作，要比 writeBuffer 低一个级别。

写数据，还有个直接对映射的 ArrayBuffer 进行写入的途径，就留给读者自己思考与上面二者的异同吧。

