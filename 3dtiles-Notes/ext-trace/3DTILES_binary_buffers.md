允许外挂 二进制文件

通过 tile 对象中的 extra 属性可以描述这个二进制文件存储了什么东西：

``` JSON
"root": {
  "boundingVolume": {
    "region": [-1.31972, 0.69884, -1.31964, 0.6989, 0, 88]
  },
  "geometricError": 70,
  "refine": "ADD",
  "content": {
    "uri": "tile.b3dm",
    "extras": {
      "editHistory": {
        "year": "2020",
        "bufferView": 0
      },
      "author": {
        "name": "Cesium",
        "bufferView": 1
      }
    }
  }
}
```

`editHistory` 这个属性，用到的是外挂二进制文件第0个 bufferView 的数据

`author` 这个属性，它的数据存储在 外挂二进制文件的 第1个 bufferView 对应的二进制数据中。

extensions 中这么写（得拥有 `bufferViews` 和 `buffers`，接近 gltf 的描述）：

``` JSON
"extensions": {
  "3DTILES_binary_buffers": {
    "bufferViews": [
      {
        "buffer": 0,
        "byteOffset": 0,
        "byteLength": 98
      },
      {
        "buffer": 0,
        "byteOffset": 100,
        "byteLength": 250
      }
    ],
    "buffers": [
      {
        "uri": "external.bin",
        "byteLength": 350
      }
    ],
    "extras": {
      "draftVersion": "0.0.0"
    }
  }
},
```

