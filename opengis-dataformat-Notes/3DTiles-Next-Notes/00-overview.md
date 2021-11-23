# 简介

3D Tiles Next 是一组针对下一代 3D Tiles 的新功能（或者说 3D Tiles 扩展）。

这些新功能目前以 3D Tiles 1.0 的扩展草案呈现，将来可能会合并到 3D Tiles 2.0 中。

# 瓦片内容（Tile Content）

## 概述

在 Next 中，glTF 2.0 数据将可以直接作为瓦片的内容，不再使用 1.0 的 `b3dm`、`i3dm`、`pnts` 和 `cmpt`，提供了与 glTF 生态的互通性。瓦片可以引用单个内容，也可以引用多个内容。

瓦片的内容也可以集合至类似于 2D 地图图层一样的容器组中。

## 3D Tiles 扩展：3DTILES_content_gltf



## 3D Tiles 扩展：3DTILES_multiple_content



# 隐式瓦片分割（Implicit Tiling）

## 概述



## 3D Tiles 扩展：3DTILES_implicit_tiling



## 3D Tiles 扩展：3DTILES_bounding_volume_S2



# 元数据（Metadata）

## 概述



## 3D Tiles 扩展：3DTILES_metadata



## 3D Tiles 扩展：EXT_mesh_features



![Example metadata at various granularities. 3D Tiles Next](attachments/1b85f829-0da4-438f-83d9-20280550b2ba_metadata-granularity-extended.png)



# 关于 Logo

Next 的 logo 的版权与 CesiumJS 的一致，给开发者使用。但是注意，这个不要作为主要用途，因为其中的 NEXT 文本会被替换。

下载链接：[3D-Tiles-Next-Logo.zip](https://github.com/CesiumGS/3d-tiles/raw/add-3d-tiles-next-logo-pack/next/logo/3D-Tiles-Next-Logo.zip)

![3D Tiles Next](attachments/3DTiles_Next_Dark.png)