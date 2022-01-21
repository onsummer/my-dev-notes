## 1 VAO 是 OpenGL 技术中提出来的

参考：

https://www.khronos.org/opengl/wiki/Tutorial2:_VAOs,_VBOs,_Vertex_and_Fragment_Shaders_(C_/_SDL)

其中有一段文字记录了 VAO 是什么：

> A Vertex Array Object (VAO) is an object which contains one or more Vertex Buffer Objects and is designed to store the information for a complete rendered object. In our example this is a diamond consisting of four vertices as well as a color for each vertex.

VAO 记录的是多个（一组） VBO 的 gl.bindBuffer 和 gl.vertexAttribPointer （WebGL API）的状态，省去切换另一组 VBO 时再次设置绑定关系和读取规则的成本。

里面也描述了 VBO 是什么：一个 VBO 可以是 position，也可以是 uv，甚至可以是 indices；当然，在 WebGL 中，你可以用 1 个 VBO 来存储 position + uv + normal，但是不能和 indices 混用（和 type 有关）。

## 2 WebGPU 天生就能先保存状态

WebGPU 不需要 VAO 了，源于 WebGPU 的机制，并不是过程式，所以不需要借助 VAO 保存绑定一组 VBO 并读取它的状态。

### 2.1 WebGL 与 WebGPU 相关 API 对比

当 device.createShaderModule 时，就有 buffers 属性描述着色器需要什么类型的数据，类似 gl.vertexAttribPointer 的作用；

而 gl.bindBuffer 的操作则由 renderPass.setVertexBuffer 完成；

关于数据的传递，gl.bufferData 的任务就由 device.createBuffer 时通过映射、解映射的机制将 TypedArray 传递进 GPUBuffer 来替代

### 2.2 谁替代了 VAO？

那么谁能在渲染时告诉着色器，我有多组 VBO 要切换呢？

准确的说，VBO 这个概念已经被 GPUBuffer + GPUShaderModule 替代了，由后者两个对象共同分担，GPUBuffer 专注于 cpu~gpu 的数据传递，GPUShaderModule 不仅仅是着色器代码本身，还承担着 GPUBuffer[type=vertex] 的数据如何读取的职能（替代了 gl.vertexAttribPointer 的职能）。

VAO 的职能则转至 GPURenderPipeline 完成，其 GPURenderPipelineDescriptor.GPUVertexState.buffers 属性是 GPUVertexBufferLayout[] 类型的，这每一个 GPUVertexBufferLayout 对象就类似于 VAO 的职能。

### 2.3 代码举例

下列只有一个 GPUVertexBufferLayout：

```javascript
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

下面有两个 GPUVertexBufferLayout：

```javascript
const renderPipeline = device.createRenderPipeline({
  vertex: {
    module: spriteShaderModule,
    entryPoint: 'vert_main',
    buffers: [
      {
        arrayStride: 4 * 4,
        stepMode: 'instance',
        attributes: [
          {
            // instance position
            shaderLocation: 0,
            offset: 0,
            format: 'float32x2',
          },
          {
            // instance velocity
            shaderLocation: 1,
            offset: 2 * 4,
            format: 'float32x2',
          },
        ],
      },
      {
        arrayStride: 2 * 4,
        stepMode: 'vertex',
        attributes: [
          {
            // vertex positions
            shaderLocation: 2,
            offset: 0,
            format: 'float32x2',
          },
        ],
      },
    ],
  },
  /* ... */
});
```

通过 renderPassEncoder.setVertexBuffer 就能切换 VBO 了：

```javascript
renderPassEncoder.setVertexBuffer(0, bf0);
renderPassEncoder.setVertexBuffer(1, bf1);
```