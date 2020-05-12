# 简介

这个扩展属性把Google的draco压缩添加到pnts瓦片中，以支持压缩流点数据。

draco压缩常见的点云属性，例如POSITION、COLOR、NORMAL以及一些通用元数据（例如反射强度INTENSITY、类别CLASSIFICATION）

本扩展属性基于Draco 2.2。

# Pnts升级

## 要素表

在ftJSON中的`extensions`属性，扩展一个属性`3DTILES_draco_point_compression`。这个属性定义了压缩的参数、在ftBinary中被压缩的数据的位置。

下列是一个简单的带Draco压缩的ftJSON：

```JSON
{
    "POINTS_LENGTH": 20,
    "POSITION": {
        "byteOffset": 0
    },
    "RGB": {
        "byteOffset": 0
    },
    "BATCH_ID": {
        "byteOffset": 0,
        "componentType": "UNSIGNED_BYTE"
    },
    "extensions": {
        "3DTILES_draco_point_compression": {
            "properties": {
                "POSITION": 0,
                "RGB": 1,
                "BATCH_ID": 2
            },
            "byteOffset": 0,
            "byteLength": 100
        }
    }
}
```

### properties属性



### byteOffset属性



### byteLength属性



### 3DTILES_draco_point_compression的featureTable预定义

完整预定义见：[3DTILES_draco_point_compression.featureTable.schema.json](https://github.com/CesiumGS/3d-tiles/blob/master/extensions/3DTILES_draco_point_compression/schema/3DTILES_draco_point_compression.featureTable.schema.json)

## 批量表





### properties属性



### 3DTILES_draco_point_compression的batchTable预定义

完整预定义见：[3DTILES_draco_point_compression.batchTable.schema.json](https://github.com/CesiumGS/3d-tiles/blob/master/extensions/3DTILES_draco_point_compression/schema/3DTILES_draco_point_compression.batchTable.schema.json)

## 注意事项

如果某些属性被压缩，而存在其他属性没有被压缩，则Draco编码器必须应用POINT_CLOUD_SEQUENTIAL_ENCODING编码方法。这样可以确保Draco保留点数据的原始顺序。

> Draco可以对点数据进行重排序，以实现最佳压缩效果。因此，应当对FeatureTable和BatchTable中的所有属性进行Draco压缩，而不要使用POINT_CLOUD_SEQUENTIAL_ENCODING

## 外部资源

- [Draco Open Source Library](https://github.com/google/draco)
- [Cesium Draco Decoder Implementation](https://github.com/CesiumGS/cesium/blob/master/Source/Workers/decodeDraco.js)

