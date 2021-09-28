WebGPU 支持两种着色器语言：`SPIR-V` 和 `WGSL`。

`SPIR-V` 实际上是科纳斯组开发的一种二进制格式，GLSL 和 HLSL 等其他语言可以编译成它，以方便移植。因为是二进制格式的，所以它并不可为人类可读，`WGSL` 就解决了这个问题，它的重点是能很容易地转变为 `SPIR-V`。

# 编写顶点着色器

假设你可以在文本格式的文件（设文件名为 `shader.wgsl`）中写如下着色器代码：

``` wgsl
// 顶点着色器

struct VertexOutput {
  [[builtin(position)]] clip_position: vec4<f32>;
}

[[stage(vertex)]]
fn main(
	[[builtin(vertex_index)]] in_vertex_index: u32,
) -> VertexOutput {
	var out: VertexOutput;
	let x = f32(1 - i32(in_vertex_index)) * 0.5;
	let y = f32(i32(in_vertex_index & 1u) * 2 - 1) *0.5;
	out.clip_position = vec4<f32>(x, y, 0.0, 1.0);
	return out;
}
```

代码最开头声明了一个结构体 `VertexOutput`，它表示顶点着色器向下一个阶段的输出内容，这个结构体只有一个字段 `clip_position`：

- 修饰它的 `[[builtin(position)]]` 是告诉 WebGPU，这个变量绑定到内置变量 `position`。`position` 内置变量与 `GLSL` 中的 `gl_Position` 的作用类似；
- 它是 `vec4` 类型的，像这种向量类型都是泛型类型的，在这里就指定为 32 位浮点数 `f32`，如果是 32 位浮点数的三维向量，那么用 `vec3<f32>` 表示。

紧随其后的是 `main` 函数，使用 `[[stage(vertex)]]` 来标记这个函数意味着它是一个顶点着色器的入口函数。这个函数将接受一个 `u32` 数值类型的内置变量 `[[builtin(vertex_index)]]`，名为 `in_vertex_index`，表示外部输入的顶点索引值。

函数里面，使用 `var` 关键字声明 `VertexOutput` 类型的结构体变量 `out`，使用 `let` 关键字声明并计算了 x 和 y 的值，最后构造了 `vec4<f32>`，并返回 out 结构体变量。其中，`f32()` 和 `i32()` 是强制转换的语法。

> 使用 var 定义的变量可以修改，但是必须指定其类型；
>
> 使用 let 定义的变量在着色器期间是不可变的，创建时可以推断其类型，可以不指定类型。

## 简便写法

其实，可以不需要定义一个结构体，如下所示：

```wgsl
[[stage(vertex)]]
fn main(
  [[builtin(vertex_index)]] in_vertex_index: u32
) -> [[builtin(position)]] vec4<f32> {
  // 顶点着色器代码...
}
```

但是要向下一个阶段输出更多数据的话，那就需要结构体了。



# 编写片元着色器

如果你愿意，你可以写片元着色器在同一个文件：

``` wgsl
// 片元着色器

[[stage(fragment)]]
fn main(
  in: VertexOutput
) -> [[location(0)]] vec4<f32> {
  return vec4<f32>(0.3, 0.2, 0.1, 1.0);
}
```

这个着色器代码的意思很简单，即对于所有片元都设为棕色 `rgba(0.3, 0.2, 0.1, 1.0)`。

你或许注意到了这个被 `[[stage(fragment)]]` 标记的片元着色器入口函数也叫 `main`，那是因为被 `[[stage]]` 修饰了，你也可以改个名字。

返回值类型是 `vec4<f32>`，`[[location(0)]]` 标记返回值要写到哪。



# 参考

https://sotrh.github.io/learn-wgpu/beginner/tutorial3-pipeline/#wgsl

