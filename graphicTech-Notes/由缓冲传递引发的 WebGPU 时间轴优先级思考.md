在 WebGPU 的执行过程中，有三条时间轴，WebGPU 的各种 API 执行顺序被分散到这三条轴上。

如果读者有了解 JavaScript 执行引擎的事件循环机制的话，其实可以对比着学习（宏任务、微任务等的执行优先顺序）。

三条轴按是这样安排的：

- 内容时间轴，JavaScript 相关的动作，譬如和 canvas 的配置
- 设备时间轴，通常是 device 对象发出的创建动作，大多数是同步的
- 队列时间轴，通常是队列对象发出的动作

有些动作可能依赖于两条时间轴，会对数据资源的 IO 有影响，跨时间轴访问同一个数据资源可能得不到正确的结果。

例如，在 commit CommandBuffer 之前进行 writeBuffer 操作，一个在设备时间轴，一个在队列时间轴，有可能导致 buffer 的访问不准确、无数据。



mapAsync 是在队列时间轴上的

writeBuffer 也是在队列时间轴上的

上述二者有性能差异，但是用法不太一样

copyBufferToBuffer 则是在设备时间轴上的



---

修改 buffer 不会影响 bindGroup 关系

mapAsync 来读写数据要在 CPU 内存端开辟一块区域，映射 GPU 上这块缓冲，具备读写优势；writeBuffer 则不需要考虑读取，且可能不需要开辟新的内存，利用现有 TypedArray 直接写入缓冲