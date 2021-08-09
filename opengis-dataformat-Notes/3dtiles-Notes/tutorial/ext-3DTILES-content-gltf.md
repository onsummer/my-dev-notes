# 简介

这项扩展允许 3d-Tiles 使用 glTF 模型（gltf 或 glb）直接充当瓦片。

相对应的，glTF 模型扩展原 3d-Tiles 瓦片应有的各种功能，以实现原来的功能。例如 `i3dm` 的各种实例属性，`b3dm` 的要素属性、批量表数据，`pnts` 的数据压缩等。

# 必选性

若用到了 glTF 模型当瓦片数据，那么必须在 `extensionsRequired` 数组中加入此扩展的名称。

（`extensionsUsed` 也是如此）。

# 数据示例

``` JSON
"extensionsUsed": ["3DTILES_content_gltf"],
"extensionsRequired": ["3DTILES_content_gltf"],
"extensions": {
    "3DTILES_content_gltf": {
        "extras": {
            "draftVersion": "0.0.0"
        }
    }
}
```

其内有两个可选数组：`gltfExtensionsUsed` 和 `gltfExtensionsRequired`，用于记录 glTF 本身的扩展。

3d-Tiles 的瓦片树JSON：

``` JSON
"root": {
    "boundingVolume": {
        "region": [
            -1.3197209591796106, 0.6988424218, -1.3196390408203893,
            0.6989055782, 0, 88
        ]
    },
    "geometricError": 70,
    "refine": "ADD",
    "content": {
        "uri": "parent.gltf",
        "boundingVolume": {
            "region": [
                -1.3197004795898053, 0.6988582109, -1.3196595204101946,
                0.6988897891, 0, 88
            ]
        }
    },
    "children": [
        {
            "boundingVolume": {
                "region": [
                    -1.3197209591796106, 0.6988424218, -1.31968,
                    0.698874, 0, 20
                ]
            },
            "geometricError": 0,
            "content": {
                "uri": "ll.gltf"
            }
        }, {
            "boundingVolume": {
                "region": [
                    -1.31968, 0.6988424218, -1.3196390408203893,
                    0.698874, 0, 20
                ]
            },
            "geometricError": 0,
            "content": {
                "uri": "lr.gltf"
            }
        }, {
            "boundingVolume": {
                "region": [
                    -1.31968, 0.698874, -1.3196390408203893,
                    0.6989055782, 0, 20
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
                    -1.3197209591796106, 0.698874, -1.31968,
                    0.6989055782, 0, 20
                ]
            },
            "geometricError": 0,
            "content": {
                "uri": "ul.gltf"
            }
        }
    ]
}
```

