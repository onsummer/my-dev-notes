草稿中。

# 简介

这项扩展允许 3d-Tiles 数据集引用外部二进制数据。

# 必选性

如果用到了外部数据，则必须在 `extensionsRequired` 中写入此扩展名。（`extensionsUsed` 也要写）。

# 扩充 `extensions` 属性

像这样：

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
}
```

其中，`bufferViews` 和 `buffers` 数组是必须存在的。