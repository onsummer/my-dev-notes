> 文档最后更新：2021年6月4日

# 1 例子介绍

本例是一个正射投影的带贴图的立方体旋转动画。

# 2 主干知识要点

## 矩阵传递

这里为了简便，使用了 `gl-matrix` 库进行矩阵创建、旋转矩阵更新。

## 使用 rAF 进行动画渲染

这就必须对哪些对象能分离，哪些不能要分辨清楚。

渲染函数需要对 renderPassDescriptor 中的附件进行更新，

需要重新创建 commandEncoder、renderPassEncoder，并执行渲染命令设置、提交

> 扩展：哪些对象是可以当作 WebGL 里的 FBO？

# 3 零碎知识要点

## API 文档的使用：关于 bindGroupLayout 的创建

## WGSL 中 [[location]] 的问题

in 和 out 变量的 location 编号是独立的，和 builtin 变量也是独立的

## WGSL 中 entry 函数的返回值与传入参数自定义

可以传递结构体

# 4 BUG 解决

## 报 CreateRenderPipeline 错误

本例是写错了 wgsl 中的 location

## 创建 深度与模板纹理对象 的 format 必须与 创建 pipeline 中阶段属性的 format 一致