# 下一代的 3D Tiles 前瞻

原文：[Introducing 3D Tiles Next, Streaming Geospatial to the Metaverse](https://cesium.com/blog/2021/11/10/introducing-3d-tiles-next/)

原文发布时间：2021年11月10日



> 阅读本文前，需要有足够的 3D Tiles 1.0 基础、glTF 规范基础、CesiumJS 基础。



# 1. 综述

`3D Tiles Next`，指的是一组 3D Tiles 扩展项。这些扩展项主要体现在三个方面的增强：

- 结构化的元数据
- 空间索引性能
- glTF 生态集成

> 官方关于元数据的限定词是 `semantic`，即语义化的，我觉得“结构化”可能更好一些。

如下图所示：

![image-20211122170650927](attachments/image-20211122170650927.png)

![image-20211122170827064](attachments/image-20211122170827064.png)

![image-20211122170936726](attachments/image-20211122170936726.png)

# 2. 元数据的增强

鉴于需求的急剧扩张，3D Tiles 扩充了元数据方面的功能。在 3D Tiles Next 中，引入一些元数据方面的扩展项。主要特点有：

- 元数据的编码方式更友好，可以用二进制，也可以写入 JSON；
- 层级扩充，可以是每纹理单元级别的元数据，也可以是每个瓦片级别的；
- 规范了元数据的格式。

与 1.0 规范使用 Batchtable（批次表）来存储元数据的目的一致，Next 的元数据扩展依旧遵循了性能优势：批量处理。

许多逻辑层面的三维要素（例如某个建筑）及其元数据，在前端运行时（可以简单认为是 CesiumJS）预先被成组成批处理，以减小 CPU 的开销。

元数据方面的扩展，分三个方面：

- 类型系统；
- 编码方式；
- 领域相关的语义化规范，领域是指 BIM、CAD 等；![image-20211122173124603](attachments/image-20211122173124603.png)

## 2.1. 元数据的类型系统

[3D 元数据规范](https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata) 定义了一套类型规范与数据的编码方式。

3D Tiles 1.0 依赖于 JSON 本身有限制的基础类型，而 Next 具备更丰富的类型支持，包括类、向量、矩阵等。

元数据的编码方式可以有：

- 二进制格式；
- JSON 格式；
- 栅格格式。

具体细节要看规范。



## 2.2. 不同层级的元数据（像素级别样式化渲染）

配合使用 [3DTILES_metadata]() 和 [EXT_mesh_features]() 两个扩展项，下一代的 3D Tiles 可以在各个层级存储元数据。这些层级可以是：

- Tileset（瓦片集）层级
- Tile / Tile ContentGroup（瓦片或瓦片组）层级
- Feature（三维要素）层级
- GPU 绘制实例层级
- Vertex（顶点）层级
- Texel（纹素）层级

如下图所示：

![Example metadata at various granularities. 3D Tiles Next](attachments/1b85f829-0da4-438f-83d9-20280550b2ba_metadata-granularity-extended.png)



纹素级别是最细的层级，允许元数据在如此细的粒度上变化。

例如，两个三角形构成一个四边形，作为一个建筑物的一侧墙面，但是此时它仅仅是“两个三角形”，在真实世界中墙面还可能会有窗的玻璃、砖的石头的区别，在拾取识别时，就可以例用“纹素级别”的元数据来辨别什么颜色是什么物体。

下面是一个例子，对倾斜摄影数据使用纹素级别的元数据：

![Street level photogrammetry of San Francisco Ferry Building from Aerometrex. Left: per-texel colors showing the feature classification, e.g., roof, sky roof, windows, window frames, and AC units . Right: classification is used to determine rendering material properties, e.g., make the windows translucent.](attachments/461af861-25b4-4053-bbdf-b40f87eaad96_ferry-building-photogrammetry-classification.png)

此处有分屏，左侧的颜色就可以很明显地区分出墙、窗户、空调、屋顶等“实际物体”，而数据的三角面组织却可以不用在意这些“实际物体”。

在右侧，利用纹素级别的元数据，就可以完成窗户单体的半透明处理。



## 2.3. 语义规范

除了层次足够细致，还要知道数据的含义，这就是所谓的“元数据的语义”，以便程序代码知道怎么进行交互编程。

例如，水泥地和草地的摩擦系数可以作为元数据，影响车辆的行驶速度等。

各领域的专家可以根据有关扩展项来定制自己专业所需的元数据，譬如在土方施工中，将材料库存、各项参数写入元数据，方便代码计算体积和面积。



# 3. *空间索引增强



## 空间分割算法：S2

3D Tiles Next 引入一项 3DTILES_bounding_volume_S2 扩展，它能与隐式瓦片、显式瓦片一起使用，定义新的空间范围体。

S2 分割是一种比四叉树更好的空间分割，它在北极、南极附近的瓦片会比较“薄”。同一级别的瓦片的尺寸是接近的。



# 4. 在三维“图层”中使用复合内容 

传统 2DGIS 会把同类数据放进同一个容器中，这个容器叫做“图层”，比如高速公路图层、POI图层、建筑图层等，这样可以统一样式设置。

使用 3DTILES_multiple_contents 扩展可以在一组 Tile 中定义“三维图层元数据”，然后将对应的三维数据绑定至这个组来实现“三维图层”、“数据与元数据的连接”。



# 5. 与 glTF 技术生态集成

在 3D Tiles 中使用 3DTILES_content_gltf 扩展，Tile 对象可以直接引用 `.gltf` 或 `.glb` 文件，而不是使用旧的 `b3dm`、`i3dm` 瓦片文件。

这样 3D Tiles 就可以直接利用 glTF 社区的成果，例如验证工具、转换工具等。

3D Tiles Next 利用到 glTF 的地方有：

- 3D Tiles 在瓦片层级直接使用 glTF 作为三维数据；
- 将 glTF 直接用于点云格式；
- 更好利用了 glTF 的扩展项。



## 5.1. *直接使用 glTF



## 5.2. *点云与 glTF



## 5.3. *继承 glTF 的扩展项



# 6. 后续进度

从发文时间起，之后的几个月将完成规范的设计。

目前的进度有：

- 起草了 3D Tiles 与 glTF 相关的扩展项：
  - [3D 元数据规范](https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata)
  - [3D Tiles 扩展：3DTILES_metadata](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_metadata)
  - [glTF 扩展：EXT_mesh_features](https://github.com/KhronosGroup/glTF/pull/2082)
  - [3D Tiles 扩展：3DTILES_implicit_tiling](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling)
  - [3D Tiles 扩展：3DTILES_bounding_volume_S2](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_bounding_volume_S2)
  - [3D Tiles 扩展：3DTILES_multipie_contents](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_multiple_contents)
  - [3D Tiles 扩展：3DTILES_content_gltf](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_content_gltf)
- 开发者相关的资源，pdf、示例数据、博客等；
- 在 CesiumJS@1.87.1 以上的例子实现
- ...



# 7. 译者注

下一代的 3D Tiles 目前没有定名为 3D Tiles 2.0，而是暂时以扩展项的方式推进。

它解决了一部分 1.0 中的问题，例如把元数据从旧的瓦片文件中的 BatchTable、FeatureTable 拆分出来，便于数据库实现；拆出来元数据后，剩下的三维数据可以直接利用 glTF 格式，而 glTF 格式本身又是可以把纹理、几何分开存储的。总之，新设计的灵活性非常强。

除了数据方面的问题，还提出了新的空间切分算法 —— 隐式瓦片，这个扩展旨在提高前端瓦片剔除和渲染的性能。

总之，现在的状态就是“请洒潘江，各倾陆海云尔”。