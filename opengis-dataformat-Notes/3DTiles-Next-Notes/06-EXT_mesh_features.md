https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features





# 规范依赖

glTF 2.0 规范

此扩展可以与 EXT_mesh_gpu_instancing 一起使用。一起使用时，EXT_mesh_gpu_instancing 定义的 "GPU 实例属性" 被用作实例的要素 ID.



# 1 概述





# 2 要素ID

## 2.1 概述

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

