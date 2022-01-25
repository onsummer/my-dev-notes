纹素，是纹理的最小独立可访问的单元，它可能是标量，也可能是向量。texel 即 texture element 的缩写。

纹理，是用于渲染的纹素集合。在 WGSL 中，这些渲染操作是通过内置的纹理函数完成的。

WGSL 的纹理对应一个 WebGPU 中的 GPUTexture

纹理可能是数组，也可能不是数组。

- 非数组型纹理就是一个纹素的网格，每个纹素都有独一无二的网格坐标
- 数组型纹理是多个大小一样的纹素网格，在这样的纹理中，每个纹素使用数组索引和网格坐标的组合来标记

纹理由要素构成：

- texel format
- dimensionality
- size
- mip level count
- arrayed
- arraysize
- addressing mode
- filter mode
- LOD clamp
- comparison
- max anisotropy



### 4.5.2 采样式纹理类型

- `texture_1d<type>`
- `texture_2d<type>`
- `texture_2d_array<type>`
- `texture_3d<type>`
- `texture_cube<type>`
- `texture_cube_array<type>`

泛型 `type`，只能是 f32、i32、u32

这个 type 决定了你在 WGSL 中使用内置纹理函数对纹理进行采样后得到的数值类型。例如，即使你的纹素格式是 8bit unorm 类型，通过设置 type 是 f32，代码中采样后的结果就是 f32 类型的数值。



### 4.5.3 多重采样纹理类型

- `texture_multisampled_2d<type>`

泛型 `type`，只能是 f32、i32、u32



