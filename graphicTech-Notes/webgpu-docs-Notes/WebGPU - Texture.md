WebGPU 之纹理

# 1 纹理的创建



## 纹理视图



## 纹理格式



# 2 为纹理输入图片数据

``` typescript
// Fetch the image and upload it into a GPUTexture.
let cubeTexture: GPUTexture;
{
  const img = document.createElement('img');
  img.src = require('../../../assets/img/Di-3d.png');
  await img.decode();
  const imageBitmap = await createImageBitmap(img);

  cubeTexture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: cubeTexture },
    [imageBitmap.width, imageBitmap.height]
  );
}
```

参考 [WebGPU Spec 12.3.5 GPUImageCopyExternalImage](https://www.w3.org/TR/webgpu/#gpu-image-copy-external-image)

``` web-idl
dictionary GPUImageCopyExternalImage {
  required (ImageBitmap or HTMLCanvasElement or OffscreenCanvas) source;
  GPUOrigin2D origin = {};
};
```

[WebGPU Spec 17 Queue createExternalImageToTexture](https://www.w3.org/TR/webgpu/#dom-gpuqueue-copyexternalimagetotexture)



---

device.importExternalTexture 这个方法貌似只能传入 HTMLVideoElement

[WebGPU Spec 4.5 GPUDevice importExternalTexture](https://www.w3.org/TR/webgpu/#gpudevice)

[WebGPU Spec 6.4.1 Import External Textures](https://www.w3.org/TR/webgpu/#external-texture-creation) 

# 3 离屏渲染（类似 WebGL Framebuffer）的容器

主要是在 GPURenderPassDescriptor.colorAttachments[i].view 和 resolveTarget 中设置。

