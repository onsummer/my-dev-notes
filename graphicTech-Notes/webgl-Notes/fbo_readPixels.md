
# gl.readPixels() 返回 0,0,0,0

参考 [webgl-readpixels-is-always-returning-0-0-0-0](https://stackoverflow.com/questions/7156971/webgl-readpixels-is-always-returning-0-0-0-0)

3 个原因：

- 没渲染完呢
- 渲染完了但是你没及时读取，上一次绘制的已经被 gl.clear 掉了
- getContext 时没设置 `preserveDrawingBuffer: true`（不太推荐这个）

也就是说，如果你要读取像素，必须在任何影响画布的函数执行后立马就读取。如果使用 setTimeout 之类的函数延时读取，可能就读得不对。

设置 `preserveDrawingBuffer: true` 或许会影响性能，这个属性设为 true 后，会阻止绘制缓冲区（颜色、深度、模板等）在画到 canvas 后的清除操作。

如果是 OffscreenCanvas 或者是内存中的 HTMLCanvasElement（不添加到 document 中，不参与浏览器渲染），因为没有发生合成操作，所以就不会被清除。



# webgl 从 fbo 中的 colorAttachment 读像素

``` js
// 读取整个颜色附件

//#region 创建 fbo 并将其设为渲染目标容器
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
//#endregion

//#region 创建离屏绘制的容器：纹理对象，并绑定它成为当前要处理的纹理对象
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
//#endregion

//#region 绑定纹理对象到 0 号颜色附件
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
//#endregion

// ... gl.drawArrays 进行渲染

//#region 读取到 TypedArray
const pixels = new Uint8Array(imageWidth * imageHeight * 4);
gl.readPixels(0, 0, imageWiebdth, imageHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
//#endregion
```



# diff rbo texture in fbo

rbo，可以 msaa（多重采样抗锯齿）但是 texture 不行

texture，能被着色器访问，也就是能被采样。



rbo 如果脱离了 fbo，就没有什么用了，而 texture 仍然可以参与普通的渲染流程



https://stackoverflow.com/questions/36300474/what-is-the-differences-between-render-buffer-object-and-depth-texture-via-webgl

https://www.cnblogs.com/fuckgiser/p/5991174.html



copyTexSubImage 可以把 fbo 中的内容拷贝到 texture 中，但是比直接渲染到纹理（RenderToTexture）慢多了。

https://stackoverflow.com/questions/28505227/how-to-draw-renderbuffer-as-texturebuffer-in-fbo
