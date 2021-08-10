# 1. 优点

## ① 数据组织极其灵活

瓦片的内容是任意的，可以是具体类型的瓦片，也可以是另一个瓦片数据集，瓦片自身也设计了合并的类型。

对空间剖分方式没有限制。



## ② 极其强大的扩展能力

除了使用了 glTF 的扩展能力外，3dTiles 本身也提供了扩展设计



## ③ 数据来源多种多样

原则上只要能转换到 glTF 的数据，均可实现 3dTiles 的瓦片转换，难点在于空间剖分方式以生成合适的树结构。

点云的处理除外。



# 2. 缺点

## ① 成也 glTF 败也 glTF

glTF 格式本身就非常灵活，其本身就支持多种三维图形所需的定义，例如动画、材质、几何信息结构等

对于 b3dm 瓦片文件而言，若已存在 tileset.json 中的瓦片定义，还要在 glb 中存储一份描述 glTF 数据本身的二进制 json，未免有点缝补之意。



## ② 瓦片的属性数据和几何数据没有分开

全部集中在一个二进制文件中，

而且对文本格式的属性支持不算很好，以 JSON 形式存储的数据只能存储一些简单的属性数据

图形、纹理、属性数据揉在一个瓦片中，会导致某些瓦片文件大的离谱的情况



## ③ 对瓦片的空间剖分没有明确设计规则

受限于实践经验，什么样的数据使用何种空间剖分的方式，对于当下的 Cesium 渲染器能达到最优效果，目前还没有一个比较统一的认知。



## ④ 数据集的索引较慢

`tileset.json` 中的树结构索引起来有可能会比线性表慢
