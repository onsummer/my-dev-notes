# 1. 简介

将 根瓦片 继续切分。

用**图层**来描述，通常结合 `3DTILES_metadata` 扩展一起使用。

一个图层，可以指向一个 b3dm，也可以指向一个 gltf，也可以指向 tileset.json。除了数据内容的指向，还可以为图层指定元数据类，用元数据类来定义此图层有哪些属性。

![3DTILES_layers Spec Map](attachments/spec_map.jpg)

# 2. 语义修改

## 2.2. 图层元数据

XXX

``` JSON
{
  "asset": {
    "version": "1.0"
  },
  "extensions": {
    "3DTILES_layers": {
      "buildings": {
        "name": "Buildings",
        "description": "3D Buildings Layer"
      },
      "trees": {
        "name": "Trees",
        "description": "3D Vegetation Layer"
      },
      "roads": {
        "name": "Roads",
        "description": "Vector Road Layer"
      }
    }
  }
}
```

XXXXXXXX

``` JSON
{
  "asset": {
    "version": "1.0"
  },
  "extensions": {
    "3DTILES_metadata": {
      "classes": {
        "cityLayer": {
          "properties": {
            "lastModified": {
              "type": "STRING",
              "optional": false
            },
            "highlightColor": {
              "type": "STRING",
              "optional": false
            }
          }
        }
      }
    },
    "3DTILES_layers": {
      "buildings": {
        "name": "Buildings",
        "description": "3D Buildings Layer",
        "class": "cityLayer",
        "properties": {
          "lastModified": "20201030T030000-0400",
          "highlightColor": "GREEN"
        }
      },
      "trees": {
        "name": "Trees",
        "description": "3D Vegetation Layer",
        "class": "cityLayer",
        "properties": {
          "lastModified": "20201030T030100-0400",
          "highlightColor": "RED"
        }
      },
      "roads": {
        "name": "Roads",
        "description": "Vector Road Layer",
        "class": "cityLayer",
        "properties": {
          "lastModified": "20201030T030200-0400",
          "highlightColor": "BLUE"
        }
      }
    }
  }
}
```

## 1.2. 图层内容



``` JSON
{
  "asset": {
    "version": "1.0"
  },
  "extensions": {
    "3DTILES_layers": {
      "buildings": {
        "name": "Buildings",
        "description": "3D Buildings Layer"
      },
      "trees": {
        "name": "Buildings",
        "description": "3D Vegetation Layer"
      },
      "roads": {
        "name": "Roads",
        "description": "Vector Road Layer"
      }
    }
  },
  "root": {
    "extensions": {
      "3DTILES_layers": {
        "contents": [
          {
            "layer": "buildings",
            "mimeType": "application/json",
            "uri": "layers/buildings/tileset.json"
          },
          {
            "layer": "trees",
            "mimeType": "application/json",
            "uri": "layers/trees/tileset.json"
          },
          {
            "layer": "roads",
            "mimeType": "application/json",
            "uri": "layers/roads/tileset.json"
          }
        ]
      }
    }
  }
}
```

> 注意，默认情况下，若瓦片被选中，代码实现部分应请求并渲染瓦片的所有内容。

# 3. 译者注