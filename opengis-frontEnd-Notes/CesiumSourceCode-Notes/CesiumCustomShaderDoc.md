自定义着色器文档 - CesiumJS `CustomShader API` 文档

# 构造器

下列代码演示了如何创建一个 CustomShader 对象（微调了官方示例代码的结构）：

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

// 应用到 3DTiles
const tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
  url: "http://example.com/tileset.json",
  customShader: customShader,
  // 若是 3DTiles 1.0 的 b3dm 和 i3dm 模型必须启用下面这个属性，1.1 的 glTF 瓦片则不用（默认开启）
  enableModelExperimental: true,
}))

// 应用于模型
const model = Cesium.ModelExperimental.fromGltf({,
  gltf: "http://example.com/model.gltf",
  customShader: customShader
})
```



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

你可以使用 url、`Resource` 实例、TypedArray 加载纹理数据。例如：

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

上面的表格中，“材质”即预处理后的纹理，使用 `czm_modelMaterial` 表示。这个结构体与 PBR 材质模型有关，不过对于 UNLIT 模型也会使用结构体内的基础色。



# 结构体 - VertexInput

GLSL 结构体，表示顶点的输入。

``` glsl
struct VertexInput {
  // 处理后的顶点属性，见下文 Attributes 结构体
  Attributes attributes;
  // Feature IDs 或 Batch IDs，见下文 FeatureIDs 结构体
  FeatureIds featureIds;
  // 属性元数据，见下文 Metadata 结构体
  Metadata metadata;
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
  // 属性元数据，见下文 Metadata 结构体
  Metadata metadata;
};
```



# 结构体 - Attributes

`Attributes` 结构体是由前端运行时根据 CustomShader 内具体数值动态生成的，它在即将被渲染的图元（Primitive）中是可用的。

举例，如果开发者在着色器中使用 `fsInput.attributes.texCoord_0` 这个变量，运行时就会从模型中获取对应的 `TEXCOORD_0` 并生成所需的着色器代码，然后把值传递给着色器（前提是这个值可用）。

如果图元没有可以用的值，那么就会使用默认值，以便着色器可以正常运行。否则顶点和片元着色器会移出不存在数据的变量。

全部内置 attributes 列举如下：

| 模型中对应的 Attribute | 着色器中的变量 | 类型    | 顶点着色器中 | 片元着色器中 | 描述                                                         |
| ---------------------- | -------------- | ------- | ------------ | ------------ | ------------------------------------------------------------ |
| `POSITION`             | `positionMC`   | `vec3`  | 没有         | 有           | 模型坐标系的位置                                             |
| `POSITION`             | `positionWC`   | `vec3`  | 没有         | 有           | 世界坐标系的位置（WGS84 椭球体的 ECEF坐标系下），低精度      |
| `POSITION`             | `positionEC`   | `vec3`  | 没有         | 有           | 观察坐标系的位置                                             |
| `NORMAL`               | `normalMC`     | `vec3`  | 有           | 没有         | 单位长度的法向量，在模型坐标系中。                           |
| `NORMAL`               | `normalEC`     | `vec3`  | 没有         | 有           | 单位长度的法向量，在观察坐标系中。                           |
| `TANGENT`              | `tangentMC`    | `vec3`  | 有           | 没有         | 单位长度的切向量，在模型坐标系中，总是 `vec3`，对于 `w` 分量在计算后会移除 |
| `TANGENT`              | `tangentEC`    | `vec3`  | 没有         | 有           | 单位长度的切向量，在模型坐标系中，总是 `vec3`，对于 `w` 分量在计算后会移除 |
| `NORMAL` & `TANGENT`   | `bitangentMC`  | `vec3`  | 有           | 没有         | 单位长度的双切向量，在模型坐标系中。当法线和切向量都有时才有效。 |
| `NORMAL` & `TANGENT`   | `bitangentEC`  | `vec3`  | 没有         | 有           | 同上                                                         |
| `TEXCOORD_N`           | `texCoord_N`   | `vec2`  | 有           | 有           | 第 `N` 个纹理坐标                                            |
| `COLOR_N`              | `color_N`      | `vec4`  | 有           | 有           | 第 `N` 个顶点颜色，总是 `vec4` 类型的，如果模型没指定透明度，那么透明度就是 1 |
| `JOINTS_N`             | `joints_N`     | `ivec4` | 有           | 有           | 第 `N` 个关节索引                                            |
| `WEIGHTS_N`            | `weights_N`    | `vec4`  |              |              |                                                              |



有些 attributes 有索引号，即 0、1、2...，例如 `texCoord_0`，就是带有一个 `N` 的意思。

自定义 Attribute 也可以用，但是要使用小写字母和下划线重命名。例如，有模型里的 Attribute 是 `_SURFACE_TEMPERATURE`，那么在着色器中就要使用 `fsInput.attributes.surface_temperature` 来调用它。



# 结构体 - FeatureIds

这个结构体是运行时自动生成的，它会把要素 ID 全部收集到一个集合中，无论来自顶点属性（attribute）、纹理还是交换值。

要素 ID 呈现为 GLSL 中的 `int` 变量，尽管在 WebGL 1.0 中这存在一些问题：

- 超过 `2^24`，数值可能会丢精度，除非使用 `highp int` 来标识浮点数的精度
-  你可以用 `uint` 来表示要素 ID，但是这个数值类型在 WebGL 2.0 中才能用



## 3DTiles 1.0 的 BatchID（向下兼容）

在 3D Tiles 1.0 标准下的 Primitive 中，标识一个三维空间要素的对等概念被称作 `BATCH_ID`（旧称 `_BATCHID`）。这些旧的批次 ID 在自定义着色器中被重命名成单独的要素 ID，总是用 0 表示：

- `vsInput.featureIds.featureId_0`（顶点着色器）
- `fsInput.featureIds.featureId_0`（片元着色器）



## 扩展 EXT_mesh_features 或 EXT_instance_features 的 FeatureID

当 3D Tiles 中存在 glTF 瓦片且使用了 `EXT_mesh_features` 或 `EXT_instance_features` 扩展，要素 ID 会出现在两个地方：

- glTF 数据中 primitive 对象中可以有 `featureIds` 数组，这个数组包括了要素 ID 属性、隐式要素 ID 属性，以及可能存在的纹理要素 ID. 无论要素 ID 的类型是什么，它们在自定义着色器中都是 `(vsInput/fsInput).featureIds.featureId_N`，其中 `N` 是 `featureIds` 数组中对应要素 ID 的索引。
- glTF 数据中 node 对象若使用 `EXT_mesh_gpu_instancing` 和 `EXT_instance_features` 可能会定义要素 ID，只能是要素 ID 或隐式要素 ID，不能是纹理要素 ID. 在自定义着色器中，它们是 `(vsInput/fsInput).featureIds.instanceFeatureId_N`，`N` 的含义与上一条相同。

纹理要素 ID 仅在片元着色器中能用。

若一组要素 ID 包括 `label` 属性（在 `EXT_mesh_features` 中的新规定），那么这个 `label` 的作用就是别名。例如，`label: "alias"`，那么在着色器中 `(vsInput/fsInput).featureIds.alias` 就相当于 `featureId_N`.

下面是一个例子。

假设我们有一个 glTF 数据，primitive 对象有如下要素 ID：

``` js
"nodes": [
  {
    "mesh": 0,
    "extensions": {
      "EXT_mesh_gpu_instancing": {
        "attributes": {
          "TRANSLATION": 3,
          "_FEATURE_ID_0": 4
        }
      },
      "EXT_instance_features": {
        "featureIds": [
          {
            // 注①
            "label": "perInstance",
            "propertyTable": 0
          },
          {
            // 注②
            "propertyTable": 1,
            "attribute": 0
          }
        ]
      }
    }
  }
],
"meshes": [
  {
    "primitives": [
      {
        "attributes": {
          "POSITION": 0,
          "_FEATURE_ID_0": 1,
          "_FEATURE_ID_1": 2
        },
        "extensions": {
          "EXT_mesh_features": {
            "featureIds": [
              {
                // 注③
                "label": "texture",
                "propertyTable": 2,
                "index": 0,
                "texCoord": 0,
                "channel"； 0
              },
              {
                // 注④
                "label": "perVertex",
                "propertyTable": 3
              },
              {
                // 注⑤
                "attribute": 4,
                "propertyTable": 4
              },
              {
                // 注⑥
                "attribute": 1,
                "propertyTable": 5
              }
            ]
          }
        }
      }
    ]
  }
]
```

注：

- ①，默认要素 ID（实例 ID），在顶点着色器中使用 `vsInput.featureIds.instanceFeatureId_0` 或 `vsInput.featureIds.perIntance` 访问；在片元着色器则是 `fsInput.featureIds.instanceFeatureId_0` 或 `vsInput.featureIds.perIntance` 访问
- ②，一个要素 ID 属性，



# 旧式 EXT_feature_metadata 扩展中的 FeatureID

`EXT_feature_metadata` 是不久之前仍在草稿中的扩展 `EXT_mesh_features` 的前身。

尽管要素 ID 的概念没怎么改变，但是 JSON 的结构已经有些不同。在旧的扩展中，`featureIdAttributes` 和 `featureIdTextures` 是分开存储的。在 CesiumJS 的实现中，要素属性和要素纹理被合成了一个列表，即 `featureIds = featureIdAttributes.concat(featureIdTextures)`. 除了这两个不同之外，要素 ID 集的标注方法和 `EXT_mesh_features` 一样了，举个例子：

- `(vsInput/fsInput).featureIds.featureId_N` 表示每个 primitive 对象中 featureIds 数组的第 `N` 个元素所表示的要素 ID
- `(vsInput/fsInput).featureIds.instanceFeatureId_N` 表示使用了 `EXT_mesh_gpu_instancing` 扩展的 glTF 数据中，node 对象对应的扩展信息数据里 `featureIds` 数组的第 `N` 个元素所表示的要素 ID.

来做个比较，下面有一个例子，将上一节的数据转换到 `EXT_feature_metadata` 扩展：

```js
"nodes": [
  {
    "mesh": 0,
    "extensions": {
      "EXT_mesh_gpu_instancing": {
        "attributes": {
          "TRANSLATION": 3,
          "_FEATURE_ID_0": 4
        },
        "extensions": {
          "EXT_feature_metadata": {
            "featureIdAttributes": [
              {
                // 注①
                "featureTable": "perInstanceTable",
                "featureIds": {
                  "constant": 0,
                  "divisor": 1
                }
              },
              {
                // 注②
                "featureTable": "perInstanceGroupTable",
                "featureIds": {
                  "attribute": "_FEATURE_ID_0"
                }
              }
            ],
          }
        }
      }
    }
  }
],
"meshes": [
  {
    "primitives": [
      {
        "attributes": {
          "POSITION": 0,
          "_FEATURE_ID_0": 1,
          "_FEATURE_ID_1": 2
        },
        "extensions": {
          "EXT_feature_metadata": {
            "featureIdAttributes": [
              {
                // 注③
                "featureTable": "perFaceTable",
                "featureIds": {
                  "constant": 0,
                  "divisor": 3
                }
              },
              {
                // 注④
                "featureTable": "perFeatureTable",
                "featureIds": {
                  "attribute": "_FEATURE_ID_0"
                }
              },
              {
                // 注⑤
                "featureTable": "otherFeatureTable",
                "featureIds": {
                  "attribute": "_FEATURE_ID_1"
                }
              }
            ],
            "featureIdTextures": [
              {
                // 注⑥
                "featureTable": "perTexelTable",
                "featureIds": {
                  "texture": {
                    "texCoord": 0,
                    "index": 0
                  },
                  "channels": "r"
                }
              }
            ]
          }
        }
      },
    ]
  }
]
```



译者注：。。。



# 结构体 - Metadata





## 规范化数值

如果属性元数据的类上有 `normalized: true` 字段值，那么

## 偏移和缩放



# 结构体 - czm_modelVertexOutput

这个结构体是内置的，参考 glsl 文件内的代码注释。

这个结构体是作为自定义顶点着色器的输出数据的，包括了：

- `positionMC` - 模型空间中的顶点坐标，你可以修改它完成一些形状方面的修改，自定义顶点着色器可以修改它（`vsInput.attributes.positionMC`），最终会给到 `gl_Position`（当然还要经过 Cesium 自己的 VP 变换）
- `pointSize` - 对应 `gl_PointSize`，仅对绘制 `gl.POINTS` 时有效

注意，修改 `positionMC` 并不会影响 Primitive 的范围球，如果顶点被修改移动至其它地方以超出剔除的范围，那就会被裁剪掉。



# 结构体 - czm_modelMaterial

这个结构体是内置的，参考 glsl 文件内的代码注释。它和 Cesium Fabric 材质系统中的 `czm_material` 结构体类似，但是成员略有不同，因为它支持 PBR 光照模型。

这个结构体是片元着色器的输入或输出参数之一。也就是说：

- 材质计算阶段用于产生材质
- 光照阶段用于传入材质信息，计算光照后存储至 `material.diffuse` 中
- 自定义片元着色器中用于接收材质信息并对其进行修改



# 参考资料

[官方自定义着色器指引](https://github.com/CesiumGS/cesium/tree/main/Documentation/CustomShaderGuide)

[在自定义着色器中如何获取 b3dm 的 FeatureTable](https://community.cesium.com/t/in-customshader-how-can-i-get-the-content-in-the-featuretable-from-b3dm/17348/2)

[问题中的例子（半透明）](https://github.com/CesiumGS/cesium/pull/10110#thread-subscription-status)
