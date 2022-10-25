# WGSL 的语法特点

很明显的 C/C++、Rust、Java/Python/Typescript 的混合作品。

Java/Python/Typescript 中的 注解/装饰器 在这被称作特性。

C++ 的模板，Rust/C/C++ 的结构体，Rust/Typescript 的参数类型与语法。

C/C++/Typescript 的类型别称。



# 结构体的声明

- 关键字 `struct` 起头
- 名称最好用大写驼峰
- 成员结束用逗号 `,`
- 结构体结束用分号 `;`

举例

``` wgsl
struct Time {
  value: f32,
};

struct Uniforms {
  scale: f32,
  offsetX: f32,
  offsetY: f32,
  scalar: f32,
  scalarOffset: f32,
};

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) v_color: vec4<f32>,
};
```

成员的命名，兼容 C/C++ 的代码风格，可以小写驼峰、大写驼峰、下划线、全大写、匈牙利等。



# 入口函数

使用特性 `@<stage>` 声明该函数是哪个阶段的入口函数，`<stage>` 可选项：

- vertex
- fragment
- compute

如果是 `compute`，那么还需要特性 `@workgroup_size`  + 参数指定三个维度的工作核心数。

举例：

```wgsl
@vertex
fn main(
  @builtin(vertex_index) VertexIndex : u32
) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 0.5),
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5)
  );

  return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
}

@fragment
fn frag_main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}

@compute @workgroup_size(64)
fn main(/* 入参列表 */) {
  // 计算着色器一般没有返回
}
```



# 变量声明关键字

- 有三种，`const`、`var`、`let`；
- 作用域有两处，全局和局部；
  - 全局一般是作用在 `BindGroup` 的资源上的，也就是 Uniform、纹理、采样器；
  - 局部一般是函数内；
- 若不是 `BindGroup` 传进来的值，要给初始值

全局举例（Uniform、纹理、采样器）：

```wgsl
// ====== vertex.wgsl =======
@group(0) @binding(0) var<uniform> scene: Scene;
@group(1) @binding(0) var<uniform> model: Model;

// ====== fragment.wgsl =======
@group(0) @binding(0) var<uniform> scene: Scene;
@group(0) @binding(1) var shadowMap: texture_depth_2d;
@group(0) @binding(2) var shadowSampler: sampler_comparison;

const albedo: vec3<f32> = vec3<f32>(0.9, 0.9, 0.9);
const ambientFactor: f32 = 0.2;
```



# 特性

就是给函数、变量加上某种特定功能的语法，使用 `@<someattr>(param_list?)` 语法，也就是参数可选。

每个特性只能作用于一个函数或者变量，只能是一对一。

举例：

```wgsl
// 三个阶段特性，作用于入口函数
@compute
@vertex
@fragment

// 计算着色器入口函数专属，指定三维度上需要用到的处理单元个数
@workgroup_size(x, y?, z?)

// 为某个变量与 wgsl 内置的变量做绑定
@builtin(name)

// 绑定组资源与某个变量（或结构体成员）绑定
@group(i) @binding(j)

// 与某个变量绑定特定的定位号（location）
// 通常出现在各个阶段函数的入参，或者向下一阶段的返回值里
@location(i)
```

还有其它的没列举。



# 循环

有 `for` 循环、`loop` 循环、`while` 循环，可以用 `break`、`continue` 关键字。

`for` 和 `while` 循环与大多数语言的类似。



# 用户自定义函数

关键字是 `fn`，格式如下：

```wgsl
@<attr>
fn <function_name>(param_list?) -> return_type? {
  // body
}
```

其中，特性、入参列表、返回值类型都是可选的。如果没有返回值类型，那就不需要 return 关键字返回东西。