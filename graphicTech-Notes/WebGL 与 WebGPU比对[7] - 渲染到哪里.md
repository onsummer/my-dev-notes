渲染到纹理：colorAttachments COPY_DST textureView

渲染到一个特殊的容器 canvas（渲染的主战场）



本篇主要讲 webgpu 的 canvas configure 机制，fbo 与离屏绘制技术、mrt 技术已经在 另一篇讲过不再展开
