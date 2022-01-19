# 1. 简介

3D Tiles Next 是一组针对下一代 3D Tiles 的新功能（或者说 3D Tiles 扩展）。

这些新功能目前以 3D Tiles 1.0 的扩展草案呈现，将来可能会合并到 3D Tiles 2.0 中。



# 2. 关于瓦片数据内容的扩展（Tile Content）

## 2.1. 概述

在 Next 中，glTF 2.0 数据将可以直接作为瓦片的内容，不再使用 1.0 的 `b3dm`、`i3dm`、`pnts` 和 `cmpt`，提供了与 glTF 生态的互通性。瓦片可以引用单个内容，也可以引用多个内容。

瓦片的内容也可以集合至类似于 2D 地图图层一样的容器组中。

虽然 Next 使用 glTF 作为瓦片文件，不再使用原来的四种瓦片文件格式，但是并不意味着运行时不再使用，这是数据规范版本的区别，而不是运行时立马就要放弃旧规范。

## 2.2. 扩展 3DTILES_content_gltf

[3DTILES_content_gltf](./01-3DTILES_content_gltf.md) 这项扩展，允许在 `Tile.content` 属性上直接引用一个 glTF 模型文件（`.gltf` 或 `.glb`）。

## 2.3. 扩展 3DTILES_multiple_content

[3DTILES_multiple_content](./02-3DTILES_multiple_content.md) 这项扩展，允许一个瓦片引用多个内容（瓦片文件）。瓦片实际上就是一块空间范围体，组织起多个瓦片文件是很正常的。

组织形式也多种多样，可以像地图图层一样，也可以随便分组。

通常会与 [3DTILES_metadata]() 扩展所组织的元数据一起用。



# 3. 隐式瓦片（Implicit Tiling）

## 3.1. 概述

隐式瓦片分割，意思就是将瓦片的空间范围和空间索引方式“隐去”，即不显式地记录在瓦片对象中，而这种隐含的空间分割方法和索引方式，则是默认数据生产者和运行时知道的。

其有效地减少了 tileset.json 这个文件的体积，并提高了空间索引的效率，寻找、遍历瓦片的速度更快，射线计算、随机访问、空间查询也更快了。

除了上述优点，还增强了与 2DGIS 中一些地理数据格式/数据库的相互集成，例如 CDB、TMS、WMTS、S2.



## 3.2. 扩展 3DTILES_implicit_tiling

启用了 [3DTILES_implicit_tiling](./03-3DTILES_implicit_tiling.md) 扩展的 tileset（瓦片集），瓦片对象有一一对应的 `.subtree` 文件，它存储了该瓦片的可见性信息，依此，意味着可以在 URI 上通过唯一的数字编码（level、x、y）进行流式传输。

启用了这项扩展的瓦片集，它的空间分割结构（树结构）就是紧凑型的了，这种树结构对遍历算法、射线计算、空间索引有帮助。

总而言之，隐式瓦片这项扩展主要是提升了大规模数据集的空间索引性能。



## 3.3. 扩展 3DTILES_bounding_volume_S2

启用 [3DTILES_bounding_volume_S2]() 扩展，意思就是把 [S2 几何体](http://s2geometry.io/) 作为瓦片的空间分割方式。

尤其是与 3DTILES_implicit_tiling 扩展一起使用时，S2 分割方式非常合适超大规模（洲际、全球）的数据，其可以最大限度地减少极地附近的失真（瓦片的空间范围长方体与赤道附近的不会大小差异过大）。它最大的特点是，同级别的格子所表示的空间范围大小是差不多的。

S2 所规定的 30 级空间范围细分等级足够精确到世界任意角落，精度达厘米级。



# 4. 元数据（Metadata）

## 4.1. 概述

通过更友好的类型系统、新的编码方式及全粒度支持，3D Tiles Next 中的元数据更加强大了。全粒度是指，元数据可以高层级对象（Tileset、Tile、TileGroup）上记录，也可以在更低层级的单元上记录，比如 glTF 中的几何形状，甚至是单个顶点、单个纹素。

随着 3D Tiles Next 一起提出的 [三维元数据规范（3D Metadata Specification）]()，成为 Next 中一切元数据的基础。这个规范提出了模式、属性类型、存储格式、属性的意义等概念，要求元数据得按这样的方式组织。

当前，已经完成在 3D Tiles 和 glTF 2.0 这两个数据规范的元数据扩展，未来其他可能的格式的扩展仍然以扩展的方式来支持。

## 4.2. 扩展 3DTILES_metadata

[3DTILES_metadata]() 扩展定义了 Tileset、Tile、TileGroup 三层的元数据如何组织。在其他情况下，元数据又另有别的方式实现，例如在下列两个扩展启用时，元数据是这么组织的：

- 在 3DTILES_implicit_tiling 中，元数据存储在 `.subtree` 二进制文件中，方便大规模的瓦片数据进行流式传输；
- 在 3DTILES_multiple_content 中，某个瓦片所指向的瓦片文件会与某个组进行绑定，那么这个组的元数据也成为了瓦片的元数据，增强了瓦片的内容组织、样式化与过滤。

## 4.3. glTF 2.0 扩展：EXT_mesh_features

[EXT_mesh_features]() 是一个 glTF 2.0 规范的扩展，通常与 3DTILES_content_gltf 一起用。启用后，元数据就可以与瓦片文件（此时就是指 gltf/glb 文件了）中的“三维要素”作用，而且是在各个不同的层级：

- 在每个 vertex（顶点）：与 3D Tiles 1.0 中的批次表一样，顶点可以通过分组来标记属于哪个“三维要素”，从而实现要素级别的元数据；
- 在每个 texel（纹素）：在几何面片不是很复杂的数据中，直接将属性值和三维要素 ID 到纹理上，即通过纹素来区分“要素”，完成元数据与三维数据对象的对应，这是一个很不错的优化手段；
- 在每个 GPU实例（GPU instance）：这个需要配合 [EXT_mesh_gpu_instancing]() 这个 glTF 2.0 的扩展来实现，类似 i3dm 的机制。



![Example metadata at various granularities. 3D Tiles Next](attachments/1b85f829-0da4-438f-83d9-20280550b2ba_metadata-granularity-extended.png)

上图简略地展示了各层级的元数据如何组织：

- 高层级的 Tileset、Tile、TileContent(Group) 由 3DTILES_metadata 扩展负责实现
- “三维要素”级别的元数据，则由 glTF 2.0 规范中的 EXT_mesh_features 扩展实现。

关于“三维要素”级别的元数据，还希望读者仔细了解 EXT_mesh_features 这个扩展的 [例子](https://github.com/CesiumGS/glTF/blob/proposal-EXT_mesh_features/extensions/2.0/Vendor/EXT_mesh_features/README.md#examples)。



## 4.4. 三维元数据规范（3D Metadata Specification）

连接：[三维元数据规范（3D Metadata Specification）](https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata)

元数据指的是瓦片这个实体数据的数据，以及瓦片数据文件中的三维要素数据的数据，那么包括上述两个在内，总要有一套规范来灵活接纳各个领域的元数据，这部分虽然不是具体的扩展项，但是也属于 Next 的重要组成部分。

这项规范还提供了一个 [三维元数据语义参考（3D Metadata Semantic Reference）](https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata/Semantics)，用于描述具体某个属性的含义。有些含义可能是通用的，比如“id”、“name”、“description”等，也可能是不通用的，需要具体问题具体分析。





# 5. 关于 Logo

Next 的 logo 的版权与 CesiumJS 的一致，给开发者使用。但是注意，这个不要作为主要用途，因为其中的 NEXT 文本会被替换。

下载链接：[3D-Tiles-Next-Logo.zip](https://github.com/CesiumGS/3d-tiles/raw/add-3d-tiles-next-logo-pack/next/logo/3D-Tiles-Next-Logo.zip)

![3D Tiles Next](attachments/3DTiles_Next_Dark.png)



# 译者注

Next 在三维模型数据格式上、空间索引上、各级空间对象的属性元数据上都下了功夫，专注于“三维大规模流式数据规范”的制定，此次提升了数据灵活性、性能，却缺少了三维里重要的一环：效果。

其实 CesiumJS 作为 3D Tiles 的主要显示运行时，它一直没把效果编程作为宣传点。不过在 Next 推进的这段时间里，官方还是提供了效果编程的一个小尾巴的，那就是随着新的三维数据加载架构发布的自定义着色器接口，允许开发者为渲染过程编写更灵活的着色器（以往只是能写后处理或者外观着色器，自定义着色器适配新架构的同时更规范化了）。

关于 3D Tiles Next 的数据生产工具截至发文（2022 年春节前夕），仍然没有特别优秀的实现，原因就是大家可能并不熟悉这个 Next，我写；也有可能就是 Web3D 本身就小众，WebGIS3D 更少人了，更别说它在搞的一个数据规范的下一代标准了，尽管在分析这些扩展的过程中，我觉得官方为了提升，还是下了一番功夫的。