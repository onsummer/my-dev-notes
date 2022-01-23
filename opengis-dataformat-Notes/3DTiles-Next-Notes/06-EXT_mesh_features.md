https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features





# 规范依赖

glTF 2.0 规范

此扩展可以与 EXT_mesh_gpu_instancing 一起使用。一起使用时，EXT_mesh_gpu_instancing 定义的 "GPU 实例属性" 被用作实例的要素 ID.



# 1 概述

此扩展定义了如何在 glTF 数据中存储几何相关联的结构化属性元数据。在大多数实时三维场景中，为了满足渲染性能，要尽可能减少网格和顶点的数量。这个要求与交互功能是相悖的，因为交互性的功能总是希望数据是完整的，并能满足用户交互和数据查看的功能。一些常用的图形几何优化手段，例如几何的合并，或者使用实例化技术，都可能导致原来属性、对象等信息的不完整。

此项扩展允许在保持实时渲染性能的条件下仍然保留三维模型的重要属性，以满足交互与属性查询。方法就是通过定义一个与几何图形对象不一样的概念，叫做“要素”，并定义属性元数据如何与这些“要素”绑定的规则。

本文所用的一些概念、定义均出自 [三维属性元数据规范 - 3D Metadata Specification](https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata)，属于是将此规范中的概念、定义实现、细化。

文末有一节列举了几个例子，可供学习。

> 虽然 glTF 有其它手段存储额外的信息，例如充分使用 extras 和 extensions 属性，或者使用 KHR_xmp_json_ld 扩展，但是此扩展与上述最大的区别就在于，此扩展所存储的额外信息，在粒度上能细到顶点或者纹素构成的一小块区域。



# 2 要素ID

## 2.1 概述

要素将几何和属性相关联在一起。在很多领域，都有类似概念。

GIS 领域中，要素表示某些点线面构成的地理对象。在 CAD/BIM 领域中，要素可能是模型中的一个组件，例如管道、消防栓等。

使用一个叫“**要素ID（Feature ID）**”的东西，可将三维要素对象与三个层级的东西相关联：

- 与 **顶点** 相关联：让每个顶点都标识上 **逐顶点ID（Per-vertex ID）**，即增加一个 “VertexAttribute”或者去修改补充顶点索引
- 与 **纹理坐标** 相关联：在一个纹理通道中使用 **逐纹素ID（Per-texel ID）**
- 与 **GPU实例** 相关联：在实例属性（Instance Attribute）中使用 **逐实例ID（Per-instance ID）**



## 2.2 顶点的要素ID

### 2.2.1 顶点属性



### 2.2.2 隐式顶点属性

## 2.3 纹理坐标的要素ID

## 2.4 GPU实例的要素ID

## 2.5 特定要素ID

### 2.5.1 使用要素ID索引属性表

### 2.5.2 使用要素ID引用外部资源



# 3 要素属性

## 3.1 概述

## 3.2 模式定义

### 3.2.1 概述

### 3.2.2 模式

### 3.2.3 类

### 3.2.4 类属性

### 3.2.5 枚举

### 3.2.6 枚举值

## 3.3 属性表

## 3.4 属性纹理



# 4 二进制数据存储（短）





# 5 可选与必选

这个扩展是可选的，意味着它应该放在 extensionsUsed 列表中，而不是放在 extensionsRequired 列表中。



# 模式定义

- [glTF.EXT_mesh_features.schema.json](https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features/schema/glTF.EXT_mesh_features.schema.json)
- [mesh.primitive.EXT_mesh_features.schema.json](https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features/schema/mesh.primitive.EXT_mesh_features.schema.json)
- [node.EXT_mesh_features.schema.json](https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features/schema/node.EXT_mesh_features.schema.json)



# 举例说明

| 例子              | 描述 | 图解 |
| ----------------- | ---- | ---- |
| 三角网格          |      |      |
| 逐顶点属性        |      |      |
| 逐三角形属性      |      |      |
| 逐点属性          |      |      |
| 逐 gltf-node 属性 |      |      |
| 多点要素          |      |      |
| 多实例要素        |      |      |
| 材质类型          |      |      |
| 复合类型          |      |      |

