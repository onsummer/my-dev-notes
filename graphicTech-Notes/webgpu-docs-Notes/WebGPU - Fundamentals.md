WebGPU 基本概念节选翻译

# 1 公共约定

节选自 [3.1 Conventions](https://www.w3.org/TR/webgpu/#api-conventions)

## ① WebGPU 接口

WebGPU 接口是内部对象的公开访问形式，和大多数语言的接口语法提供的功能差不多。

这里只需注意，继承了 `GPUObjectBase` 的接口都是 WebGPU 接口。

``` web-idl
interface mixin GPUObjectBase {
  attribute USVString? label;
};
```

label 字段用来描述对象自身，可空。

## ② 对象描述者

对象描述者包含创建一个对象所需的信息，通常调用 `GPUDevice` 的 `createXXX` 方法完成。

``` web-idl
dictionary GPUObjectDescriptorBase {
  USVString label;
};
```

此处的 label 和 GPUObjectBase 的 label 含义差不多。

# 2 坐标系统

节选自 [3.3 Coordinate Systems](https://www.w3.org/TR/webgpu/#coordinate-systems)

- 在 NDC 中，Y轴朝上。NDC的点 `(-1.0, -1.0)` 位于 NDC 的左下角。NDC的 X 和 Y 的最大最小值为 1 和 -1，Z 的取值范围是 `[0, 1]`。NDC 中超出此范围的点会被剪裁。
- 在 Framebuffer、视口坐标系和 Fragment/像素坐标系中 Y轴朝下。原点 `(0, 0)` 位于这几个坐标系的左上角。
- 视窗坐标和帧缓存（Framebuffer）坐标相匹配。
- 纹理坐标的原点 `(0, 0)` 表示纹理数据的第一个纹素（texel）。

WebGPU 的坐标系和 DirectX 坐标系匹配。



# 3 核心对象

节选自 [3.5 Core Internal Objects](https://www.w3.org/TR/webgpu/#core-internal-objects)



# 4 GPU特性与能力极限

节选自 [3.6 Optional Capabilities](https://www.w3.org/TR/webgpu/#optional-capabilities)



