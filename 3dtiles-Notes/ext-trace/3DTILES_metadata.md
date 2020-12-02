# 概览

这个扩展允许声明元数据类的情况、描述整个 tileset 的元数据。

这个扩展通常与 `3DTILES_layers` 一起使用，关系见下图：

![3DTILES_layers Spec Map](attachments/spec_map.jpg)

# 可选性

这个是可选扩展，仅需在 `extensionsUsed` 中出现，而不需要在 `extensionsRequired` 中出现。



# 概念

## ① Metadata

Metadata 指的是应用领域的特定信息。它可以与 3dTiles 中的其他对象有关联，包括 tileset、layers、tiles 或 features。

> 译者注，本文就出现了与 tileset、layers、tiles 的关联，读者请慢慢看，了解一下是如何 “关联” 的

### Classes：数据集内的分类列表，每个都是 “元数据类”

类是 Metadata 中的模板信息，每个类拥有其属性和属性的类型。例如，一个包含了若干种 3d 数据来源的 3dTileset，就可以记录下这些来源信息：x 

``` JSON
{
  "classes": {
    "photogrammetry": {
      "properties": {
        //...
      }
    },
    "bim": {
      "properties": {
        //...
      }
    },
    "pointCloud": {
      "properties": {
        //...
      }
    }
  }
}
```

这里每个类的书写格式均遵循此规范：[3d-tiles/README.md at implicit-tiling-metadata · CesiumGS/3d-tiles (github.com)](https://github.com/CesiumGS/3d-tiles/blob/implicit-tiling-metadata/specification/Metadata/0.0.0/README.md#classes)

### Properties：“元数据类”的属性

每个 Class 均带一个 `Properties` 对象。每个 Property 则拥有它自己的描述信息，例如对于 `type ` 属性是数组的，那么这个 Property 还会有 `componentCount` 和 `componentType` 属性。当然可以把 Property 设为可选的，设置默认值即可。

Properties 也有书写规范，在上面的 Classes 书写规范中也带了。

举例：

``` JSON
{
  "classes": {
    "photogrammetry": {
      "properties": {
        "sensorVersion": {
          "type": "STRING"
        },
        "author": {
          "type": "STRING",
          "optional": true,
          "default": "Cesium"
        },
        "year": {
          "type": "INT32"
        }
      }
    },
    "bim": {
      "properties": {
        "modelAuthor": {
          "type": "STRING"
        }
      }
    },
    "pointCloud": {
      "properties": {
        "scanner": {
          "type": "STRING"
        }
      }
    }
  }
}
```

### Tileset Metadata：数据集的元数据

可以通过设置 `tileset` 这个对象作为 `3DTILES_metadata` 的子属性，以设置整个 tileset 的元数据。

`tileset` 这个对象可以为其指定 `name` 和 `description`。还可以为其指定一个具体的 `class`，这个具体的 class 在 tileset 同级别的 `classes` 中存在即可。同时，与 name、description、class 同级别的属性还有一个是 `properties`，与上述对 properties 的数据定义一致。

``` JSON
{
  "extensions": {
    "3DTILES_metadata": {
      "classes": {
        "photogrammetry": {
          "properties": {
            "sensorVersion": {
              "type": "STRING"
            },
            "author": {
              "type": "STRING",
              "optional": true,
              "default": "Cesium"
            },
            "year": {
              "type": "INT32"
            }
          }
        }
      },
      "tileset": {
        "name": "Photogrammetry tileset",
        "description": "Photogrammetry tileset captured from drone survey",
        "class": "photogrammetry",
        "properties": {
          "sensorVersion": "20.1.1",
          "year": 2020
        }
      }
    }
  }
}
```





# 译者注

2020年12月3日

元数据扩展（3DTILES_metadata）通常和图层扩展（3DTILES_layers）一起配合使用，解决 3dTiles 在对象级别的逻辑区分问题（以前在 3dTiles 中很难辨识哪些瓦片是建筑，哪些是倾斜摄影等，很难通过代码或数据观察将 “对象” 和 “数据” 联系在一起）。

图层扩展提供了树状分层，元数据扩展则定义了某个图层的元数据应该是什么样子的。见下例：

``` JSON
{
  "asset": {
    "version": "1.0"
  },
  "geometricError": 32768.0,
  "extensionsRequired": [
    "3DTILES_layers",
    "3DTILES_metadata"
  ],
  "extensionsUsed": [
    "3DTILES_layers",
    "3DTILES_metadata"
  ],
  "root": {
    "boundingVolume": {
      "region": [
        -1.7074684758166778,
        0.54359911736543987,
        -1.7067080890553497,
        0.54416505068266019,
        203.89508305676281,
        253.11363569926471
      ]
    },
    "geometricError": 32768.0,
    "refine": "ADD",
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

其中，`extensions` 顶级属性里就含了 `3DTILES_metadata` 和 `3DTILES_layers` 两大扩展。

`3DTILES_layers` 把整个 3dTiles 分为 `buildings`、`trees`、`roads` 三块（三个图层），而每个图层的具体类别、属性则由 `3DTILES_metadata` 中的定义，在具体 layer 下进行具体化，`3DTILES_metadata` 更像是给图层提供元数据的格式。

