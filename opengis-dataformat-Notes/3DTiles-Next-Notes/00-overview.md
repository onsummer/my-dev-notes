# 简介

3D Tiles Next 是一组针对下一代 3D Tiles 的新功能（或者说 3D Tiles 扩展）。

这些新功能目前以 3D Tiles 1.0 的扩展草案呈现，将来可能会合并到 3D Tiles 2.0 中。

# 瓦片内容（Tile Content）

## 概述

在 Next 中，glTF 2.0 数据将可以直接作为瓦片的内容，不再使用 1.0 的 `b3dm`、`i3dm`、`pnts` 和 `cmpt`，提供了与 glTF 生态的互通性。瓦片可以引用单个内容，也可以引用多个内容。

瓦片的内容也可以集合至类似于 2D 地图图层一样的容器组中。

虽然 Next 使用 glTF 作为瓦片文件，不再使用原来的四种瓦片文件格式，但是并不意味着运行时不再使用，这是数据规范版本的区别，而不是运行时立马就要放弃旧规范。

## 3D Tiles 1.0 扩展：3DTILES_content_gltf

[3DTILES_content_gltf](./01-3DTILES_content_gltf.md) 这项扩展，允许在 `Tile.content` 属性上直接引用一个 glTF 模型文件（`.gltf` 或 `.glb`）。

## 3D Tiles 1.0 扩展：3DTILES_multiple_content

[3DTILES_multiple_content](./02-3DTILES_multiple_content.md) 这项扩展，允许一个瓦片引用多个内容（瓦片文件）。瓦片实际上就是一块空间范围体，组织起多个瓦片文件是很正常的。

组织形式也多种多样，可以像地图图层一样，也可以随便分组。

通常会与 [3DTILES_metadata]() 扩展所组织的元数据一起用。



# 隐式瓦片分割（Implicit Tiling）

## 概述

隐式瓦片分割，意思就是将瓦片的空间范围和空间索引方式“隐去”，即不显式地记录在瓦片对象中，而这种隐含的空间分割方法和索引方式，则是默认数据生产者和运行时知道的。

其有效地减少了 tileset.json 这个文件的体积，并提高了空间索引的效率，寻找、遍历瓦片的速度更快，射线计算、随机访问、空间查询也更快了。

除了上述优点，还增强了与 2DGIS 中一些地理数据格式/数据库的相互集成，例如 CDB、TMS、WMTS、S2.

## 3D Tiles 1.0 扩展：3DTILES_implicit_tiling

启用了 [3DTILES_implicit_tiling](./03-3DTILES_implicit_tiling.md) 扩展的 tileset（瓦片集），瓦片有一个一一对应的 `.subtree` 文件，它存储了该瓦片的可见性信息，依此，意味着可以在 URI 上通过唯一的数字编码（level、x、y）进行流式传输。

启用了这项扩展的瓦片集，它的空间分割结构（树结构）就是紧凑型的了，这种树结构对遍历算法、射线计算、空间索引有帮助。

## 3D Tiles 1.0 扩展：3DTILES_bounding_volume_S2

启用 [3DTILES_bounding_volume_S2]() 扩展，意思就是把 [S2 几何体](http://s2geometry.io/) 作为瓦片的空间分割方式。

尤其是与 3DTILES_implicit_tiling 扩展一起使用时，S2 分割方式非常合适超大规模（洲际、全球）的数据，其可以最大限度地减少极地附近的失真（不会过小）。它最大的特点是，同级别的格子的面积是差不多大的。



# 元数据（Metadata）

## 概述

通过更友好的类型系统、新的编码方式及全粒度支持，3D Tiles Next 中的元数据更加强大了。全粒度是指，元数据可以高层级对象（Tileset、Tile、TileGroup）上记录，也可以在更低层级的单元上记录，比如 glTF 中的几何形状，甚至是单个顶点、单个纹素。

随着 3D Tiles Next 一起提出的 [三维元数据规范（3D Metadata Specification）]()，成为 Next 中一切元数据的基础。这个规范提出了模式、属性类型、存储格式、属性的意义等概念，要求元数据得按这样的方式组织。

当前，已经完成在 3D Tiles 和 glTF 2.0 这两个数据规范的元数据扩展，未来其他可能的格式的扩展仍然以扩展的方式来支持。

## 3D Tiles 1.0 扩展：3DTILES_metadata

[3DTILES_metadata]() 扩展定义了 Tileset、Tile、TileGroup 三层的元数据如何组织。在其他情况下，元数据又另有别的方式实现，例如在下列两个扩展启用时，元数据是这么组织的：

- 在 3DTILES_implicit_tiling 中，元数据存储在 `.subtree` 二进制文件中，方便大规模的瓦片数据进行流式传输；
- 在 3DTILES_multiple_content 中，某个瓦片所指向的瓦片文件会与某个组进行绑定，那么这个组的元数据也成为了瓦片的元数据，增强了瓦片的内容组织、样式化与过滤。

## glTF 2.0 扩展：EXT_mesh_features

[EXT_mesh_features]() 是一个 glTF 2.0 规范的扩展，通常与 3DTILES_content_gltf 一起用。启用后，元数据就可以与瓦片文件（此时就是指 gltf/glb 文件了）中的“三维要素”作用，而且是在各个不同的层级：

- 在每个 vertex（顶点）：与 3D Tiles 1.0 中的批次表一样，顶点可以通过分组来标记属于哪个“三维要素”，从而实现要素级别的元数据；
- 在每个 texel（纹素）：在几何面片不是很复杂的数据中，直接将属性值和三维要素 ID 到纹理上，即通过纹素来区分“要素”，完成元数据与三维数据对象的对应，这是一个很不错的优化手段；
- 在每个 GPU实例（GPU instance）：这个需要配合 [EXT_mesh_gpu_instancing]() 这个 glTF 2.0 的扩展来实现，类似 i3dm 的机制。



![Example metadata at various granularities. 3D Tiles Next](attachments/1b85f829-0da4-438f-83d9-20280550b2ba_metadata-granularity-extended.png)

上图简略地展示了各层级的元数据如何组织：

- 高层级的 Tileset、Tile、TileContent(Group) 由 3DTILES_metadata 扩展负责实现
- “三维要素”级别的元数据，则由 glTF 2.0 规范中的 EXT_mesh_features 扩展实现。

关于“三维要素”级别的元数据，还希望读者仔细了解 EXT_mesh_features 这个扩展的 [例子](https://github.com/CesiumGS/glTF/blob/proposal-EXT_mesh_features/extensions/2.0/Vendor/EXT_mesh_features/README.md#examples)。



## 3D Metadata Specification

这项规范提供了一个 [语义参考]()，用于描述具体某个属性的含义。有些含义可能是通用的，比如“id”、“name”、“description”等，也可能是不通用的，需要具体问题具体分析。





# 关于 Logo

Next 的 logo 的版权与 CesiumJS 的一致，给开发者使用。但是注意，这个不要作为主要用途，因为其中的 NEXT 文本会被替换。

下载链接：[3D-Tiles-Next-Logo.zip](https://github.com/CesiumGS/3d-tiles/raw/add-3d-tiles-next-logo-pack/next/logo/3D-Tiles-Next-Logo.zip)

![3D Tiles Next](attachments/3DTiles_Next_Dark.png)