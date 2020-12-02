`3DTILES_layers` + `3DTILES_metadata`：升级 3dTiles 对瓦片和属性之间的描述关系，允许在组织瓦片时加入额外的 “图层”、“图层属性”、“元数据” 等比较面向对象而不是面向图形渲染的信息。这两个有点像旧版本的 featuretable

`3DTILES_binary_buffers` + `3DTILES_content_gltf`：升级瓦片内容，有点像把 b3dm 的属性数据和 gltf 分拆的感觉，binary_buffers 像旧版本的 batchtable

`3DTILES_extent` + `3DTILES_bounding_volume`：更明确指定数据范围？

`3DTILES_implicit_tiling`：更科学规范地组织瓦片的空间结构（莫顿编码）

最后一个 隐式瓦片扩展，最为重要，其次是 metadata 扩展。