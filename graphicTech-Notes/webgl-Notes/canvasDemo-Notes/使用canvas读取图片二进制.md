思路



- 根据 url 创建 Image 对象
- 创建 canvas 元素，使用 Image 对象的长宽
- 使用 canvas.drawImage() 将 Image 类实例绘制出来（离屏绘制）
- 使用 canvas.getImageData() 读取画布上的二进制数据，返回长宽、Uint8ClampedArray

通常是 4 个 Uint8 构成一个 pixel（rgb+透明度，8bit 制）



代码

``` typescript
function getImageData(img: Image) {
  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')
  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)
  
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas. height)
  return imageData // A object include Uint8ClampedArray(data)、width、height
}
```

例如，传送一张 360*180 的 png，其返回的 imageData 中的 data 属性，将会有 259200 bytes 的数据（4×360×180）