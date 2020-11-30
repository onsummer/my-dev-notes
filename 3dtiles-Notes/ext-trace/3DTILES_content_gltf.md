# 1. 简介



# 2. 可选或必选



# 3. 语义更新



# 4. 例子

[3d-tiles/extensions/3DTILES_content_gltf/0.0.0/examples/tileset at 3d-tiles-next · CesiumGS/3d-tiles (github.com)](https://github.com/CesiumGS/3d-tiles/tree/3d-tiles-next/extensions/3DTILES_content_gltf/0.0.0/examples/tileset)

tileset.json 

parent.gltf -> ll.gltf lr.gltf ul.gltf ur.gltf

允许 tileset.json 中的 tile 对象的 uri 直接指向 gltf/glb 文件。

此外，需要声明用了扩展

``` JSON
"extensionsUsed": ["3DTILES_content_gltf"],
"extensionsRequired": ["3DTILES_content_gltf"],
"extensions": {
  "3DTILES_content_gltf": {
    "extras": {
      "draftVersion": "0.0.0"
    }
  }
},
```

