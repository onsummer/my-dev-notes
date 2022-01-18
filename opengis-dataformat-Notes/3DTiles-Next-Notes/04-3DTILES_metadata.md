3DTILES_implicit_tiling

---

[TOC]

---

# 依赖于

3D Tiles 1.0



# 可选与必需

如果用到了元数据，那么这项扩展必须同时出现在 `extensionsUsed` 和 `extensionsRequired` 数组中，即“必需的”。

# 1. 概述

此扩展定义了一种在 3D Tiles 中存储结构化的元数据的机制，这些元数据一般又称作属性数据，来源广泛，可用于数据检查、分析、样式化 3D Tiles 或者其他用途。

这些属性数据要根据模板来记录，这种模板被称作“Schema（模式）”，使得属性数据有章可循。而且，不同层级的对象（最大的对象是 Tileset，依次向下为 Tile 等）有不同的关联方式。

下列说明不同层级的对象的元数据（属性）的细节：

- 对于 Tileset 级别，
- 对于 Tile 级别
- 对于 Tile Content Groups 级别



# 2. 元数据

## 2.1. 概述

Property 描述某个实体（实体指 Tileset、Tile 或者 TileGroup）的信息。

Schema 为 Class 定义数据类型等元数据信息。

每个实体，都是 Class 的具体实例，有着 Class 内记录的数据值。

此外，Statistics 可把特定 Class 内的统计值抽取出来单独存储；Semantic 则用于定义特定 Property 的用法和含义。



## 2.2. Schema（模式）



## 2.3. Class（类）



## 2.4. 类的属性



## 2.5. 枚举



## 2.6. 枚举值



## 2.7. 统计值



# 3. 元数据的分配

`classes` 只是定义了属性元数据的数据类型和含义，3D Tiles 中的实际元素并未真正具备实际的数据。

每个 3D Tiles 实际元素的属性元数据都会包含它属于哪个 `class`，用 class 的 name 来标识，而且属性元数据的具体属性字段都与 class 中规定的字段对应（名称一致，数据类型一致），如果某个属性字段在它的 class 中没有 `required: true` 的规定，那么它可以不出现在 JSON 中。

大多数属性元数据直接写在 JSON 中，但是隐式瓦片分割扩展的 tileset 中的隐式瓦片的属性元数据是例外，它用二进制的方式存储属性元数据。

接下来由粗到细地看属性元数据在各个层级的元素上的具体例子。

## Tileset 层级的属性元数据

规范参考 tileset.schema.json 和 metadataEntity.schema.json

作用在整个 tileset 级别的属性元数据，常见的属性可能有：年份信息、数据生产者详细信息、tileset 的一般性上下文等。

例子：

``` json
{
  "extensions": {
    "3DTILES_metadata": {
      "schema": {
        "classes": {
          "city": {
            "properties": {
              "name": {"componentType": "STRING", "semantic": "NAME", "required": true},
              "dateFounded": {"componentType": "STRING", "required": true},
              "population": {"componentType": "UINT32", "required": true},
              "country": {"componentType": "STRING"}
            }
          }
        }
      },
      "tileset": {
        "class": "city",
        "properties": {
          "name": "Philadelphia",
          "dateFounded": "October 27, 1682",
          "population": 1579000
        }
      }
    }
  }
}
```

这个例子中的 `extensions` 是整个 tileset.json 的顶级属性，`tileset` 属性和 `schema` 是同级别的，均为 `extensions.3DTILES_metadata` 的成分。

`tileset` 属性指定了这个 tileset 最顶级元素，即瓦片数据集本身的属性元数据。它的 class 是 `"city"`，可以在 schema 中找到，例子中将 city 这个 class 的三条 `required: true` 属性分配到了，即 `"name"` 的 `"Philadelphia"`，`"dateFounded"` 的 `"October 27, 1682"` 和 `"population"` 的 `1579000`。

## Tile 层级的属性元数据

规范参考 [tile.3DTILES_metadata.schema.json]() 和 [metadataEntity.schema.json]()

每个瓦片允许有自己的属性元数据，例如添加一些空间信息以方便空间索引算法的遍历。

下面的例子会使用内置的 semantic `TILE_MAXIMUM_HEIGHT`，具体参考 (3D Metadata Semantic Reference)[]

``` json
{
  "extensions": {
    "3DTILES_metadata": {
      "schema": {
        "classes": {
          "tile": {
            "properties": {
              "maximumHeight": {
                "semantic": "TILE_MAXIMUM_HEIGHT",
                "componentType": "FLOAT32"
              },
              "countries": {
                "description": "Countries a tile intersects.",
                "type": "ARRAY",
                "componentType": "STRING"
              }
            }
          }
        }
      }
    }
  },
  "root": {
    "extensions": {
      "3DTILES_metadata": {
        "class": "tile",
        "properties": {
          "maximumHeight": 4418,
          "countries": ["United States", "Canada", "Mexico"]
        }
      }
    },
    "content": { ... },
    ...
  }
}
```

很容易看到这是一个传统的 tileset，没有使用隐式瓦片分割扩展。

属性元数据作用在 root 瓦片的 extensions.3DTILES_metadata 属性上，指明了属性元数据遵循 tile 这个 class，它记录了 tile 这个 class 规定的两项属性字段，其中 `maximumHeight` 字段拥有内置的语义（semantic）—— "TILE_MAXIMUM_HEIGHT"，其值指定为 `4418`；`countries` 字段则是一个常规的字符串数组，其值为 `["United States", "Canada", "Mexico"]`。

## 隐式瓦片的属性元数据

规范参考 [subtree.3DTILES_metadata.schema.json]() 和 [metadataEntity.schema.json]()

此部分需要有 3DTILES_implicit_tiling 的先导基础。

若某个 tileset 启用了隐式瓦片分割扩展，那么 tileset.json 中就没有每个 tile 的 JSON 定义了，此时每个 tile 的属性元数据就需要记录在别的地方，那就是 subtree 文件中的 JSON 和 binary 中，也就是说 3DTILES_implicit_tiling 扩展可以与 3DTILES_metadata 扩展兼容使用。

既然 subtree 文件是二进制文件，那干脆就把属性元数据也编码进二进制中，JSON 部分只留读取二进制中属性元数据的字节存储描述信息。具体的编码规范，参考 [元数据规范 - 存储格式 - Binary Table Format](https://github.com/CesiumGS/3d-tiles/blob/main/specification/Metadata/README.md#binary-table-format)

二进制编码对大数据集是有好处的。

注意，瓦片的属性元数据仅对可见的瓦片有效，并且对于每个可见的隐式瓦片，就算没有某个属性字段，那这个属性的值也需要使用对应的 noData 符号占位。

> 实现注意：为了确定某个特定隐式瓦片的某个属性在属性数组中的索引值，需要根据该子树内所有隐式瓦片的可见性顺序来计算这个隐式瓦片的前置可见瓦片数量。比如，如果在某个特定的隐式瓦片之前有 i 个可见瓦片，那么这个特定的隐式瓦片的某个属性值将存储在属性值数组的第 i 个。这些可见瓦片的复杂的索引信息需要提前计算。

下列是一个 subtree 文件中 JSON 的部分（不包含注释）：

``` json
{
  "tileAvailability": {"bufferView": 0},
  "contentAvailability": {"bufferView": 1},
  "childSubtreeAvailability": {"bufferView": 2},
  "extensions": {
    "3DTILES_metadata": {
      "class": "tile",
      "properties": {
        "horizonOcclusionPoint": {
          "bufferView": 3
        },
        "countries": {
          "bufferView": 4,
          "arrayOffsetBufferView": 5,
          "stringOffsetBufferView": 6
        }
      }
    }
  },
  "buffers": [
    {"byteLength": 99692}
  ],
  "bufferViews": [
    {"buffer": 0, "byteLength": 688, "byteOffset": 0},
    {"buffer": 0, "byteLength": 688, "byteOffset": 688},
    {"buffer": 0, "byteLength": 2048, "byteOffset": 1376},
    {"buffer": 0, "byteLength": 49152, "byteOffset": 3424},
    {"buffer": 0, "byteLength": 24576, "byteOffset": 50528},
    {"buffer": 0, "byteLength": 8196, "byteOffset": 75104},
    {"buffer": 0, "byteLength": 16388, "byteOffset": 83304}
  ]
}
```

瓦片可见性、瓦片内容可见性、孩子子树可见性数据被编码在 0、1、2 这三个 bufferView 所指向的二进制数据中，但是这个 subtree 的 buffer 却有 7 个 bufferView，其中 3、4、5、6 号 bufferView 正是给 3DTILES_metadata 用的。

3DTILES_implicit_tiling 规定了瓦片的分割方案、子树的可见性内容编码，这样在 tileset.json 中就无需显示指定每一层每一个瓦片对象的信息了，一切都可以根据 level 和瓦片坐标计算而来。

与上一小节的 root 瓦片类似，在这一簇 子树中，每一个隐式瓦片的属性元数据都实现自 tile 这个 class，只不过具体的属性字段信息不再是 JSON，而是编码成了二进制，所以在 properties 中看到的数据指向是 bufferView 的编号。

例如，horizonOcclusionPoint 属性字段的数据存储在 bufferViews[3]，countries 属性字段因为是不定长字符串数组类型，所以有三个数值需要存储，即数据本身 bufferView[4]，存储 arrayOffset 的 bufferView[5]，和存储 stringOffset 的 bufferView[6]。

具体二进制是如何存储这些类型各异的元数据的可以参考 [元数据规范 - 存储格式](https://github.com/CesiumGS/3d-tiles/blob/main/specification/Metadata/README.md#storage-formats) 中 BinaryTableFormat 的部分，在 Array part 的第二个例子中有图示，简单的说就是数据本身是字符串的各个字符的字节信息，stringOffset 是每个字符串的起始长度，arrayOffset 则是每一个不定长字符串数组的起始 stringOffset 索引号。


## Content Group 的属性元数据

规范参考 [group.schema.json]()、[tileset.3DTILES_metadata.schema.json]() 和 [metadataEntity.schema.json]()

一个 Tile 可能会包含超过一个数据内容（参考 3DTiles Next 扩展 3DTILES_multiple_contents），或者说多个瓦片数据内容是可以共享一个元数据的。本扩展可以与多重瓦片内容的瓦片一起搭配使用。

对属性元数据进行分组是有意义的，比如瓦片内只有一部分数据内容是有元数据的，这样只需记录有元数据的那部分瓦片内容的属性元数据；或者像“图层”一样使用多重瓦片内容的瓦片，可以使用属性元数据来控制瓦片的数据内容的可视化或者样式化。

瓦片数据内容是如何分配分组的属性元数据的呢？在 tile.content 的 JSON 中，记录其 extensions.3DTILES_metadata 属性，指派 `group` 属性即可。每个 tile.content 只能对应一个 group，但是一个 group 可以赋予给任意个 tile.content。

> 译者注
>
> 对于瓦片中的每个 group，其可能出现一种情况：共用一个 class，但是每个 group 的具体属性元数据不同，需要分别给每个 group 记录属性元数据。
>
> 此时，在 schema 的同级别再定义一个 groups，每个 group 指定其 class 和 class 规定的 properties 值即可。然后每个 content 直接记录 group 的名称，即可实现多数据内容的 tile 共用一个 class，但是属性元数据又可以分组的情形。
>
> 官方将 group 具体的属性元数据抽离到 groups 中，而不是直接记录在 content 的 extensions 中，估计是为了方便解耦，让 content 专注于 content，但是 tile 的又是自己记录属性元数据，这让我有点迷惑。

下面为官方例子：

``` json
{
  "extensions": {
    "3DTILES_metadata": {
      "schema": {
        "classes": {
          "layer": {
            "properties": {
              "name": {"componentType": "STRING", "semantic": "NAME", "required": true},
              "color": {"type": "VEC3", "componentType": "UINT8"},
              "priority": {"componentType": "UINT32"}
            }
          }
        }
      },
      "groups": {
        "buildings": {
          "class": "layer",
          "properties": {
            "name": "Buildings Layer",
            "color": [128, 128, 128],
            "priority": 0
          }
        },
        "trees": {
          "class": "layer",
          "properties": {
            "name": "Trees Layer",
            "color": [10, 240, 30],
            "priority": 1
          }
        }
      }
    }
  },
  "root": {
    "extensions": {
      "3DTILES_multiple_contents": {
        "content": [
          {
            "uri": "buildings.glb",
            "extensions": {"3DTILES_metadata": {"group": "buildings"}}
          },
          {
            "uri": "trees.glb",
            "extensions": {"3DTILES_metadata": {"group": "trees"}}
          }
        ]
      }
    },
    ...
  }
}
```

这个例子有一个 `layer` class，与 schema 同级别的有一个 `groups` 属性，意味着属性有两个分组，一个是 `buildings` 属性，一个是 `trees` 属性，这两个的属性均为 layer 这个 class 的具象化，而落实到具体的瓦片数据内容上，就是 root 瓦片的两个复合数据内容所指派的信息了，譬如 `content[0]`，它的 uri 是 `"buildings.glb"`，它的属性元数据指派为 `buildings` 这个 group。



## 更深层次的要素级属性元数据

3D Tiles 只记录瓦片的结构拓扑，但是每个瓦片的数据内容仍然可以细分为不同的层级。

这部分不属于 3D Tiles 中 “tile” 的定义了，需要到 glTF 的扩展中补充扩展定义，即 [EXT_mesh_features]() 扩展，这与 3DTILES_metadata 并不冲突，都是 [3D元数据规范 - 3D Metadata Specification]() 的内容，只不过上述四类属于瓦片层级，再往下探则能细化元数据到 glTF 的 primitive、mesh、node 等元素里了。



# 4. 模式定义

- [tileset.3DTILES_metadata.schema.json](https://github.com/CesiumGS/3d-tiles/blob/main/extensions/3DTILES_metadata/schema/tileset.3DTILES_metadata.schema.json)
- [tile.3DTILES_metadata.schema.json](https://github.com/CesiumGS/3d-tiles/blob/main/extensions/3DTILES_metadata/schema/tile.3DTILES_metadata.schema.json)
- [content.3DTILES_metadata.schema.json](https://github.com/CesiumGS/3d-tiles/blob/main/extensions/3DTILES_metadata/schema/content.3DTILES_metadata.schema.json)



