本文对应 [WGSL Spec 1. Introduction](https://www.w3.org/TR/WGSL/#intro)



# 窥一斑

WebGPU API 应用程序使用专有的着色器语言：WGSL。

``` wgsl
[[stage(fragment)]]
fn main() -> [[location(0)]] vec4<f32> {
    return vec4<f32>(0.4, 0.4, 0.8, 1.0);
}
```

它转到 `SPIR-V` 非常容易，它没有 `SPIR-V` 的 多态、指针、重载 等特性。



# 技术概览

WebGPU 通过触发一个 GPU 指令（通常，在 WebGPU 中被编码到指令缓存中）来启动一个单元的任务。

WGSL 能写两种 GPU 指令，`DrawCommand` 和 `DispatchCommand`，即绘制指令和调度指令：

- 绘制指令 `DrawCommand` 对应一个渲染管线的执行，渲染管线相关的有其输入、输出、资源绑定组等，见 WebGPU 的内容；
- 调度指令 `DispatchCommand` 对应一个计算管线的执行，计算管线相关的有其输入和资源绑定组，见 WebGPU 的内容。

上述两种管线所使用到的着色器代码均由 WGSL 书写。

## 概念细分：着色器与着色器语言

**Shader**，着色器，是 WGSL 程序的组成部分。在管线中，它是一个着色阶段。

着色器的构成如下：

- 入口函数（Entry Point Function）
- 以入口函数为起点所用到的所有作用域内的调用函数，包括用户自定义的和内置的
- 上述函数静态访问的所有变量和常量
- 用于定义上述变量或常量的类型、结构等

