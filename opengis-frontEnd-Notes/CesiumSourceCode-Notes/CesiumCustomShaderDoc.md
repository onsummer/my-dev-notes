自定义着色器文档 - CesiumJS `CustomShader API` 文档

# 构造器

``` js

const uniforms = {
  u_time: {
    value: 0,
    type: Cesium.UniformType.FLOAT
  },
  u_externalTexture: {
    value: new Cesium.TextureUniform({
      url: "http://example.com/image.png"
    }),
    type: Cesium.UniformType.SAMPLER_2D
  }
}
const varyings = {
  v_customTexCoords: Cesium.VaryingType.VEC2
}

// 顶点着色只负责修改模型空间里的坐标，相机和投影变换仍热由 Cesium 自己完成
const vertexShaderText = `
  // 函数签名必须与下例一样，即使用 vertexMain 作为函数名
  // 参数类型、顺序也与这里的一样，以便程序优化和生成着色器
  void vertexMain(
  	VertexInput vsInput, 
  	inout czm_modelVertexOutput vsOutput) {
  	
    // 写顶点着色器代码，如果留空就代表不对顶点进行操作
  }
`
const fragmentShaderText = `
	// 函数签名必须与下例一样
  void fragmentMain(
  	FragmentInput fsInput, 
  	inout czm_modelMaterial material) {
  	
    material.diffuse = vec3(1.0, 0.0, 0.0);
    material.alpha = 0.5;
  }
`

const customShader = new Cesium.CustomShader({
  uniforms,
  varyings,
  mode: Cesium.CustomShaderMode.MODIFY_MATERIAL,
  lightingModel: Cesium.LightingModel.PBR,
  isTransluent: true,
  vertexShaderText,
  fragmentShaderText,
})
```





# 使用自定义着色器

自定义着色器可以应用于 3DTiles 或 ModelExperimental 创建的三维对象。

``` js
const customShader = new Cesium.CustomShader(/* ... */);

// 应用于 3DTiles
const tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
  url: "http://example.com/tileset.json",
  customShader: customShader
}))

// 应用于模型
const model = Cesium.ModelExperimental.fromGltf({,
  gltf: "http://example.com/model.gltf",
  customShader: customShader
})
```



> 注：截至 2022年2月25日，当前只有使用了 `3DTILES_content_gltf` 扩展的 3DTiles 数据集才能使用自定义着色器，后续会增加其它瓦片格式的支持。



# Uniforms（统一值）

统一值的对照表如下所示：

| Uniform 类型    | GLSL 类型   | JavaScript 类型  |
| --------------- | ----------- | ---------------- |
| `FLOAT`         | `float`     | `Number`         |
| `VEC2/3/4`      | `vec2/3/4`  | `Cartesian2/3/4` |
| `INT`           | `int`       | `Number`         |
| `INT_VEC2/3/4`  | `ivec2/3/4` | `Cartesian2/3/4` |
| `BOOL`          | `bool`      | `Boolean`        |
| `BOOL_VEC2/3/4` | `bvec2/3/4` | `Cartesian2/3/4` |
| `MAT2/3/4`      | `mat2/3/4`  | `Matrix2/3/4`    |
| `SAMPLER_2D`    | `sampler2D` | `TextureUniform` |

## 纹理

你可以使用 url 或 TypedArray 加载纹理数据。例如：

```js
// 直接使用资源 URL
const textureFromUrl = new Cesium.TextureUniform({
  url: "https://example.com/image.png"
})

// 使用类型数组创建一个 1x1 像素的纹理
const textureFromTypedArray = new Cesium.TextureUniform({
  typedArray: new Uint8Array([255, 0, 0, 255]),
  width: 1,
  height: 1,
  pixelFormat: Cesium.PixelFormat.RGBA,
  pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
})

// TextureUniform 类提供了若干参数来控制纹理的采样
const textureWithSampler = new Cesium.TextureUniform({
  url: "https://example.com/image.png",
  repeat: false,
  minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
  magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
})
```



# Varyings（交换值）

举例：

``` js
const customShader = new Cesium.CustomShader({
  // 在这里定义一个 v_selectedColor 交换值
  varyings: {
    v_selectedColor: VaryingType.VEC3,
  },
  // 然后在自定义的顶点着色器中就可以使用，无需声明
  vertexShaderText: `
    void vertexMain(
    	VertexInput vsInput, 
    	inout czm_modelVertexOutput vsOutput) {
    	
        float positiveX = step(0.0, positionMC.x);
        v_selectedColor = mix(
            vsInput.attributes.color_0,
            vsInput.attributes.color_1,
            vsOutput.positionMC.x
        );
    }
  `,
  // 然后在自定义的片元着色器中就可以使用，无需声明
  fragmentShaderText: `
    void fragmentMain(
    	FragmentInput fsInput, 
    	inout czm_modelMaterial material) {
    	
        material.diffuse = v_selectedColor;
    }
  `,
});
```

自定义着色器支持的交换值类型对比如下：

| Varying 的类型 | GLSL 类型  |
| -------------- | ---------- |
| `FLOAT`        | `float`    |
| `VEC2/3/4`     | `vec2/3/4` |
| `MAT2/3/4`     | `mat2/3/4` |



# 自定义着色器模式

自定义的片元着色器是可以配置的，配置它在材质的光照之前或者之后运行。

| 模式                    | 片元着色器管线描述         | 描述                                               |
| ----------------------- | -------------------------- | -------------------------------------------------- |
| `MODIFY_MATERIAL`(默认) | 材质 → 自定义着色器 → 光照 | 自定义着色器改的是赋予材质之后的片元值             |
| `REPLACE_MATERIAL`      | 自定义着色器 → 光照        | 自定义着色器接管材质阶段，自己控制材质如何影响片元 |



# 结构体 - VertexInput

GLSL 结构体，表示顶点的输入。

``` glsl
struct VertexInput {
  // 处理后的顶点属性，见下文 Attributes 结构体
  Attributes attributes;
  // Feature IDs 或 Batch IDs，见下文 FeatureIDs 结构体
  FeatureIds featureIds;
  
  /*
    在未来，属性元数据会在这里附上
  */
}
```



# 结构体 - FragmentInput

这个结构体的成员和 `VertexInput` 结构体是一样的，但是在不同的坐标空间下，还会有一些自动变量。

``` glsl
struct FragmentInput {
  // 处理后的顶点属性，见下文 Attributes 结构体
  Attributes attributes;
  // Feature IDs 或 Batch IDs，见下文 FeatureIDs 结构体
  FeatureIds featureIds;
  
  /*
    在未来，属性元数据会在这里附上
  */
};
```



# 结构体 - Attributes



# 结构体 - FeatureIds



## 3DTiles 1.0 的 BatchID



## EXT_mesh_features 的 FeatureID



# 结构体 - czm_modelVertexOutput

这个结构体是内置的，参考 glsl 文件内的代码注释。

这个结构体是作为自定义顶点着色器的输出数据的，包括了：

- `positionMC` - 模型空间中的顶点坐标，你可以修改它完成一些形状方面的修改，自定义顶点着色器可以修改它（`vsInput.attributes.positionMC`），最终会给到 `gl_Position`（当然还要经过 Cesium 自己的 VP 变换）
- `pointSize` - 对应 `gl_PointSize`，仅对绘制 `gl.POINTS` 时有效

注意，修改 `positionMC` 并不会影响 Primitive 的范围球，如果顶点被修改移动至其它地方以超出剔除的范围，那就会被裁剪掉。



# 结构体 - czm_modelMaterial

这个结构体是内置的，参考 glsl 文件内的代码注释。它和 `czm_material` 结构体类似，但是成员略有不同，因为它支持 PBR 光照模型。

这个结构体是片元着色器的输入或输出参数之一。也就是说：

- 材质计算阶段用于产生材质
- 光照阶段用于传入材质信息，计算光照后存储至 material.diffuse 中
- 自定义片元着色器中用于接收材质信息并对其进行修改



# 参考资料

[官方自定义着色器指引](https://github.com/CesiumGS/cesium/tree/main/Documentation/CustomShaderGuide)

[在自定义着色器中如何获取 b3dm 的 FeatureTable](https://community.cesium.com/t/in-customshader-how-can-i-get-the-content-in-the-featuretable-from-b3dm/17348/2)

[问题中的例子（半透明）](https://github.com/CesiumGS/cesium/pull/10110#thread-subscription-status)
