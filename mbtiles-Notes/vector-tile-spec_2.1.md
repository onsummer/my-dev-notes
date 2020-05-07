# 1 目标

使得二维地理矢量数据体积尽可能小，让在浏览器浏览时速度尽可能高。

# 2 文件格式

矢量瓦片使用Google的`pbf`格式（Protocol Buffers）作为编码格式。它与语言、平台无关，用于序列化结构类型的数据。

## 2.1 文件扩展名

矢量瓦片的文件扩展名是`*.mvt`。

## 2.2 MIME

`application/vnd.mapbox-vector-tile`

# 3 投影与范围

矢量瓦片表示的是投影坐标系的、方块区域内的数据。矢量瓦片本身不包含坐标系描述信息，也不包含范围信息，默认解码器就知道投影坐标系和范围。

通常使用Web墨卡托坐标系，以及谷歌瓦片切片方案。它们对特定区域、特定缩放级别提供了一一对应的关系，例如这个url:`https://example.com/17/65535/43602.mvt`.

不过，本矢量瓦片规范支持任意的投影以及切片方案。

# 4 内部结构

本节描述内部结构。读者应先对[矢量瓦片协议缓冲定义文档](https://github.com/mapbox/vector-tile-spec/blob/master/2.1/vector_tile.proto)有所了解。

## 4.1 图层



## 4.2 要素



## 4.3 几何编码



### 4.3.1 Command Integers



### 4.3.2 Parameter Integers



### 4.3.3 Command Types



#### ①MoveTo 命令



#### ②LineTo 命令



#### ③ClosePath 命令





### 4.3.4 Geometry Types

每个要素的几何数据由`type`属性描述，`type`属性必须是`GeomType`中的枚举值：

- UNKNOWN
- POINT
- LINESTRING
- POLYGON

不支持`GEOMETRY COLLECTION`。

#### ①未知几何类型



#### ②点几何类型



#### ③线段几何类型



#### ④多边形几何类型



### 4.3.5 几何编码举例

#### ①点



#### ②多点



#### ③折线



#### ④复合折线



#### ⑤多边形



#### ⑥复合多边形



## 4.4 要素属性



## 4.5 例子

若有一个geojson数据：

``` JSON
{
    "type": "FeatureCollection",
    "features": [
        {
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -8247861.1000836585,
                    4970241.327215323
                ]
            },
            "type": "Feature",
            "properties": {
                "hello": "world",
                "h": "world",
                "count": 1.23
            }
        },
        {
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -8247861.1000836585,
                    4970241.327215323
                ]
            },
            "type": "Feature",
            "properties": {
                "hello": "again",
                "count": 2
            }
        }
    ]
}
```

那么，结构化后的数据为：

``` JSON
layers {
  version: 2
  name: "points"
  features: {
    id: 1
    tags: 0
    tags: 0
    tags: 1
    tags: 0
    tags: 2
    tags: 1
    type: Point
    geometry: 9
    geometry: 2410
    geometry: 3080
  }
  features {
    id: 2
    tags: 0
    tags: 2
    tags: 2
    tags: 3
    type: Point
    geometry: 9
    geometry: 2410
    geometry: 3080
  }
  keys: "hello"
  keys: "h"
  keys: "count"
  values: {
    string_value: "world"
  }
  values: {
    double_value: 1.23
  }
  values: {
    string_value: "again"
  }
  values: {
    int_value: 2
  }
  extent: 4096
}
```

几何数据与瓦片的投影、范围有密切关系。