# 1 简介

**隐式瓦片** 是一个用于快速索引、遍历 3dtiles 的算法。

拥有此算法实现的 3dtiles 被规整地切分成四叉树或八叉树。这种算法可以让 tileset.json 更紧凑。

这个扩展能应用在任意一个瓦片上，它规定了瓦片将如何细分，并记录了它的数据资源在哪里。

对于稀疏数据集，**可用性数据** 用来确定瓦片是否存在。为了支持大规模的数据，可用性数据将被分割成固定大小的 **子树**。子树使用紧凑的二进制文件存储。

此扩展允许使用瓦片空间索引号来访问瓦片，例如使用 `(level, x, y)` 来索引四叉树，用 `(level, x, y, z)` 来索引八叉树。

![img](attachments/implicit-vs-explicit.jpg)

# 2 使用场景

主要的作用就是加速瓦片遍历，提高性能。使用瓦片空间索引比遍历整个瓦片速度快得多。除此之外，射线求交、GIS空间分析也能从中受益。这样，就可以立刻加载瓦片，而不是必须自顶向下遍历式加载。

按空间索引号访问还有助于空间查询。例如，指定点的高分辨率的瓦片（层级非常细）的查询将会快的飞起。

此扩展与现有的本身就带切分方案的GIS数据能很好的结合。例如如下数据：

- CDB
- S2
- WMTS
- TMS

# 3 瓦片扩展

在 tileset.json 中任意一个 tile 里可以使用 `3DTILES_implicit_tiling` 扩展，使用之后这个瓦片就叫做隐式瓦片。如果根瓦片就是隐式瓦片，那么它必须没有 children 属性。

``` json
{
  "asset": {
    "version": "1.0"
  },
  "geometricError": 10000,
  "extensionsUsed": [
    "3DTILES_implicit_tiling",
  ],
  "extensionsRequired": [
    "3DTILES_implicit_tiling",
  ],
  "root": {
    "boundingVolume": {
      "region": [-1.318, 0.697, -1.319, 0.698, 0, 20]
    },
    "refine": "REPLACE",
    "geometricError": 5000,
    "content": {
      "uri": "content/{level}/{x}/{y}.b3dm"
    },
    "extensions": {
      "3DTILES_implicit_tiling": {
        "subdivisionScheme": "QUADTREE",
        "subtreeLevels": 7,
        "maximumLevel": 20,
        "subtrees": {
          "uri": "subtrees/{level}/{x}/{y}.subtree"
        }
      }
    }
  }
}
```

它有四个属性：`subdivisionScheme`、`subtreeLevels`、`maximumLevel` 和 `subtrees`。

之后会详细解释这个 json 各个参数的含义。

# 4 切分模式

简要介绍了四叉树和八叉树，针对 `box` 和 `region` 作了参数解释。

## 切分规则

在需要进行隐式瓦片切分的那个瓦片的 JSON 中指定切分规则、细化策略、包裹范围、几何误差即可。

| 属性                | 切分规则                                                     |
| ------------------- | ------------------------------------------------------------ |
| `subdivisionScheme` | 从隐式根瓦片开始子瓦片都是这个值                             |
| `refine`            | 从隐式根瓦片开始子瓦片都是这个值                             |
| `boundingVolume`    | 如果 `subdivisionScheme` 是 `QUADTREE`，那么每个瓦片一分为四；如果是 `OCTREE`，那么一分为八 |
| `geometricError`    | 每个瓦片的几何误差，是其父瓦片的一半                         |

# 5 瓦片坐标（瓦片空间索引）

瓦片坐标，又叫瓦片空间索引号，是每个瓦片的唯一标识元组。

索引从 0 开始，四叉树是 `(level, x, y)`，八叉树是 `(level, x, y, z)`。

`level` 是 0 则代表隐式根瓦片，它的子瓦片该值是 1，以此类推。

## 对于 `box` 类型的空间范围

| 索引 | 方向      |
| ---- | --------- |
| x    | 沿着正x轴 |
| y    | 沿着正y轴 |
| z    | 沿着正z轴 |

![Box coordinates](attachments/box-coordinates.jpg)

## 对于 `region` 类型的空间范围

| 索引 | 正方向                   |
| ---- | ------------------------ |
| x    | 东到西，经度增加的方向   |
| y    | 南到北，即纬度增加的方向 |
| z    | 底到顶，即海拔高         |

![Region Coordinates](attachments/region-coordinates.jpg)



# 6 模板URI

模板URI 是一个空间索引的字符串模板。

四叉树的模板包括 `level`、`x`、`y` 三个变量，八叉树再加一个 `z`。指定任意一个瓦片，这些变量将是唯一确定的数值。

例如：

```
== 四叉树例子 ==
模板: "content/{level}/{x}/{y}.pnts"
合法的文件uri: 
- content/0/0/0.pnts
- content/1/1/0.pnts
- content/3/2/2.pnts

== 八叉树例子 ==
模板: "content/{level}/{x}/{y}/{z}.b3dm"
合法的文件uri:
- content/0/0/0/0.b3dm
- content/1/1/1/1.b3dm
- content/3/2/1/0.b3dm
```

除了特别指定外，这些路径都是基于 tileset.json 入口文件的。

![Template URI](attachments/template-uri.jpg)

# 7 子树

为了更好地对稀疏数据集的支持，需要加一些记录稀疏信息的额外数据，叫做 **可用性**。



## 可用性

每个子树包括三个可用性数据：瓦片可用性、内容可用性、下一级子树可用性。

瓦片可用性，指示当前瓦片是否存在

内容可用性，指示瓦片是否有关联的数据资源

下一级子树可用性，指示从当前子树可以访问它的哪些子树







## ①瓦片可用性

使用莫顿编码

## ②内容可用性



## ③下一级子树可用性



# 8 子树文件的格式

子树文件是一个二进制文件，包含了一个单一子树可用性信息。它有两个很重要的信息块，JSON来描述数据如何存储，二进制块来存储数据。

文件使用小端编码，包含一个24 byte 的文件头。

![Subtree Binary Format](attachments/binary-subtree.jpg)

Magic是字符串 `subt`，Version当前版本是数字1.

JSON块、二进制数据块的尺寸必须是8的倍数以对齐字节。如果不够，那JSON用 0x20 值填充尾部（空格），二进制用 0x00（0值）填充尾部。

## Buffers 和 BufferViews



为了高效地内存访问，bufferview 的 byteoffset 必须 8 字节对齐。

``` json
{
  "buffers": [
    {
      "name": "Internal Buffer",
      "byteLength": 16
    },
    {
      "name": "External Buffer",
      "uri": "external.bin",
      "byteLength": 32
    }
  ],
  "bufferViews": [
    {
      "buffer": 0,
      "byteOffset": 0,
      "byteLength": 11
    },
    {
      "buffer": 1,
      "byteOffset": 0,
      "byteLength": 32
    }
  ],
  "tileAvailability": {
    "constant": 1,
  },
  "contentAvailability": {
    "bufferView": 0
  },
  "childSubtreeAvailability": {
    "bufferView": 1
  }
}
```

> 译者注：此模式参考了 glTF





# 9 术语



# 10 例子

见 example 文件夹

# 11 本扩展JSON规则



# 12 子树JSON规则

