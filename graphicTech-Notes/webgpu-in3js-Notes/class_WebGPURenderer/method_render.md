渲染器的 render 方法。

方法的类型定义：

``` typescript
class WebGPURenderer {
  render(scene: Scene, camera: Camera): void;
}
```





``` js
passEncoder.endPass();
device.queue.submit([
  cmdEncoder.finish()
]);
```

最终，结束通道编码器的编码，调用设备对象的队列的提交方法，将指令编码器用 `finish` 方法返回的指令编码缓存提交到 GPU，这样 `render` 函数调用就完成了，也即渲染一帧相当于提交一个渲染通道。