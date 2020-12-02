# 1. 简介

允许 tileset.json 中的 tile 对象的 uri 直接指向 gltf/glb 文件。

# 2. 可选或必选

若用到这个扩展，则必须写入 `entensionsUsed` 和 `extensionsRequired` 中。

# 3. 语义更新

略。

# 4. 例子

[3d-tiles/extensions/3DTILES_content_gltf/0.0.0/examples/tileset at 3d-tiles-next · CesiumGS/3d-tiles (github.com)](https://github.com/CesiumGS/3d-tiles/tree/3d-tiles-next/extensions/3DTILES_content_gltf/0.0.0/examples/tileset)

``` JSON
{
  "asset": {
    "version": "1.0"
  },
  "extensionsUsed": ["3DTILES_content_gltf"],
  "extensionsRequired": ["3DTILES_content_gltf"],
  "extensions": {
    "3DTILES_content_gltf": {
      "extras": {
        "draftVersion": "0.0.0"
      }
    }
  },
  "geometricError": 240,
  "root": {
    "boundingVolume": {
      "region": [
        -1.3197209591796106,
        0.6988424218,
        -1.3196390408203893,
        0.6989055782,
        0,
        88
      ]
    },
    "geometricError": 70,
    "refine": "ADD",
    "content": {
      "uri": "parent.gltf",
      "boundingVolume": {
        "region": [
          -1.3197004795898053,
          0.6988582109,
          -1.3196595204101946,
          0.6988897891,
          0,
          88
        ]
      }
    },
    "children": [
      {
        "boundingVolume": {
          "region": [
            -1.3197209591796106,
            0.6988424218,
            -1.31968,
            0.698874,
            0,
            20
          ]
        },
        "geometricError": 0,
        "content": {
          "uri": "ll.gltf"
        }
      },
      {
        "boundingVolume": {
          "region": [
            -1.31968,
            0.6988424218,
            -1.3196390408203893,
            0.698874,
            0,
            20
          ]
        },
        "geometricError": 0,
        "content": {
          "uri": "lr.gltf"
        }
      },
      {
        "boundingVolume": {
          "region": [
            -1.31968,
            0.698874,
            -1.3196390408203893,
            0.6989055782,
            0,
            20
          ]
        },
        "geometricError": 0,
        "content": {
          "uri": "ur.gltf"
        }
      },
      {
        "boundingVolume": {
          "region": [
            -1.3197209591796106,
            0.698874,
            -1.31968,
            0.6989055782,
            0,
            20
          ]
        },
        "geometricError": 0,
        "content": {
          "uri": "ul.gltf"
        }
      }
    ]
  }
}
```

可以看到本体几乎与原来的 3dtiles 无异，只是 uri 指向了 gltf。