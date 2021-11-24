3DTILES_multiple_content

---

# 依赖于

3D Tiles 1.0；

隐式瓦片分割依赖于此扩展。详见 [3DTILES_implicit_tiling](./03-3DTILES_implicit_tiling.md)



# 可选与必需

如果用到了 glTF 作为瓦片内容文件，那么它必须同时出现在 `extensionsUsed` 和 `extensionsRequired` 数组中，即“必需的”。



# 1. 概述

这项扩展对单个瓦片提供了引用多个数据文件的支持。这多个数据文件，可以是 b3dm、pnts 或者 1.0 中瓦片格式中的任意类型。

![image-20211125031914912](attachments/image-20211125031914912.png)

上图表示瓦片与内容（数据文件）的关系。

多数据文件（即多内容）让 Tileset 的结构更加灵活。例如，某个瓦片可以引用 b3dm 和 pnts 两种瓦片，都表示同一个建筑物的表面，而运行时则可以选择性地只加载点云的数据。

当此扩展与 3DTILES_metadata 扩展一起使用时，可以把内容（数据文件）打组，每个组可以共享同一份自己的元数据，如下图所示：

![image-20211125032153420](attachments/image-20211125032153420.png)

上图有三组，红色组分布在左边两个瓦片，代表小车；绿色分布在上面和左下三个瓦片中，代表树木；灰色以此类推。

![image-20211125032430803](attachments/image-20211125032430803.png)

分组的好处见上图：过滤不想显示的内容，减少带宽使用。

多内容扩展可以与 3DTILES_implicit_tiling 一起使用，是兼容的。见下文。



# 2. 概念

3DTILES_multiple_contents 扩展作用于 Tile 对象。模式定义见文末。

举例：

```json
{
  "root": {
    "refine": "ADD",
    "geometricError": 0.0,
    "boundingVolume": {
      "region": [-1.707, 0.543, -1.706, 0.544, 203.895, 253.113]
    },
    "extensions": {
      "3DTILES_multiple_contents": {
        "content": [
          {
            "uri": "buildings.b3dm"
          },
          {
            "uri": "trees.i3dm"
          }
        ]
      }
    }
  }
}
```

在 root 瓦片的 extensions 属性内，记录了一个 `3DTILES_multiple_content` 对象，这个对象就记录了两个 `content`（作为数组）。可以看到这里的多个数据文件组合了 b3dm 和 i3dm，意味这块瓦片的区域内，有建筑模型，也有树木模型。

注意，若启用此扩展，Tile 对象的 `tile` 属性将不再使用。

而且，`content` 数组中任意一个 content，将不能指向外部 Tileset。



## 2.1. *元数据组



## 2.2. *瓦片隐式分割



## 2.3. 在隐式分割的瓦片中的元数据组

如果同时使用 3DTILES_implicit_tiling 和 3DTILES_metadata 扩展，那么可以向模板 URI 给到一个元数据组。

``` json
{
  "extensions": {
    "3DTILES_metadata": {
      "schema": {
        "classes": {
          "layer": {
            "properties": {
              "color": {
                "type": "ARRAY",
                "componentType": "UINT8",
                "componentCount": 3
              },
              "order": {
                "componentType": "INT32"
              }
            }
          }
        }
      },
      "groups": {
        "buildings": {
          "class": "layer",
          "properties": {
            "color": [128, 128, 128],
            "order": 0
          }
        },
        "trees": {
          "class": "layer",
          "properties": {
            "color": [10, 240, 30],
            "order": 1
          }
        }
      }
    }
  },
  "root": {
    "refine": "ADD",
    "geometricError": 16384.0,
    "boundingVolume": {
      "region": [-1.707, 0.543, -1.706, 0.544, 203.895, 253.113]
    },
    "extensions": {
      "3DTILES_multiple_contents": {
        "content": [
          {
            "uri": "buildings/{level}/{x}/{y}.b3dm",
            "extensions": {
              "3DTILES_metadata": {
                "group": "buildings"
              }
            }
          },
          {
            "uri": "trees/{level}/{x}/{y}.i3dm",
            "extensions": {
              "3DTILES_metadata": {
                "group": "trees"
              }
            }
          }
        ]    
      },
      "3DTILES_implicit_tiling": {
        "subdivisionScheme": "QUADTREE",
        "subtreeLevels": 10,
        "maximumLevel": 16,
        "subtrees": {
          "uri": "subtrees/{level}/{x}/{y}.subtree"
        }
      }
    }
  }
}
```



# 附 3DTILES_multiple_content 模式定义

``` json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "tile.3DTILES_multiple_contents.schema.json",
  "title": "3DTILES_multiple_contents tile extension",
  "type": "object",
  "description": "Extends a tile to have multiple contents. When this extension is used the tile's `content` property must be omitted.",
  "allOf": [
    {
      "$ref": "tilesetProperty.schema.json"
    }
  ],
  "properties": {
    "content": {
      "type": "array",
      "description": "An array of contents.",
      "items": {
        "$ref": "content.schema.json"
      },
      "minItems": 1
    },
    "extensions": {},
    "extras": {}
  },
  "required": [
    "content"
  ]
}
```

