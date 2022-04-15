# 创建

你可以在 `Primitive.js` 模块中找到一个叫 `createCommands()` 的函数，它利用 `Primitive` 的数据，获取统一值（`uniform`），更新或创建当前 `Primitive` 的 **颜色绘图指令**。

这个函数最后就是一个 `for` 循环，除去双通道判断、无深度纹理判断之外，主要的代码就是更新或创建颜色绘图指令：

``` js
const length = colorCommands.length;
let vaIndex = 0;
for (let i = 0; i < length; ++i) {
  let colorCommand;
  
  // ...
  
  colorCommand = colorCommands[i];
  if (!defined(colorCommand)) {
    colorCommand = colorCommands[i] = new DrawCommand({
      owner: primitive, // 入参，即当前 Primitive
      primitiveType: primitive._primitiveType,
    });
  }
  colorCommand.vertexArray = primitive._va[vaIndex]; // VertexArray
  colorCommand.renderState = primitive._frontFaceRS; // frontFaceRenderState
  colorCommand.shaderProgram = primitive._sp; // ShaderProgram
  colorCommand.uniformMap = uniforms; // 统一值
  colorCommand.pass = pass; // 该指令的通道顺序，Pass.TRANSLUCENT 或 Pass.OPAQUE
}

++vaIndex;
```







# 参考资料

- [博客园 - 法克鸡丝 - Cesium原理篇：6 Render模块(5: VAO&RenderState&Command) ](https://www.cnblogs.com/fuckgiser/p/6002210.html)
- [知乎 - 三维网格 - Cesium 高性能扩展之DrawCommand（一）：入门](https://zhuanlan.zhihu.com/p/453880906)