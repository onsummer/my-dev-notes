mbtiles是一种用于在SQLite数据库中存储任意切片地图数据的规范。

mbtiles是一个紧凑严格的规范。它只支持二维数据，例如矢量、影像栅格等。

它不像SpatialLite、GeoJson、RasterLite，它的目标不是原始数据的存储而是专于渲染，与WMTS、i3s、3dtiles等类似。

一个mbtiles文件代表了一个简单的瓦片数据集。

使用正球墨卡托投影（即3857），在元数据中仅支持经纬度来显示边界范围、中心点。

# 摘要

略。

# 兼容性

略。主要注意元数据里的属性，否则会出现兼容性问题。

# 数据库标准

使用SQLite3及以上的版本。不需要SQLite扩展功能，用核心的就可以了。

# 数据库

略。

# 1. 字符集

全部使用utf-8.

## 1.1 元数据

### 预定义

必须包括一个名为`metadata`的表或者视图。

这个表必须要有`name`和`value`两个文本类型的列。

### 内容

`metadata`表使用键值对存储，必须包括以下两行

- `name`(文本)：瓦片数据集人类可识别的名称
- `format`(文本)：单个瓦片的格式：pbf、jpg、png、webp或IETF媒体类型中的一种。

`pbf`是一种gzip压缩格式，是Mapbox的矢量瓦片格式。

`metadata`表应包括下列4个数据：

- `bounds`(使用逗号分隔的字符串)：地图的边界框。边界框必须覆盖所有缩放级别。这个数据的值与openlayers的边界格式一样，即（左，下，右，上），以WGS84坐标系的经纬度表达。例如，忽略两极范围的地球边界框是：`-180.0,-85,180,85`.
- `center`(使用逗号分隔的字符串)：地图默认中心经纬度、缩放级别。例如：`-122.1906,37.7599,11`.
- `minzoom`(数字)：瓦片最小缩放级别
- `maxzoom`(数字)：瓦片最大缩放级别

metadata表可以包括以下4个数据：

- `attribution`(HTML字符串)：描述了数据源、地图的样式。
- `description`(字符串)：对瓦片内容的描述
- `type`(字符串)：`overlay`或者`baselayer`
- `version`(数字)：瓦片数据集的版本，而不是mbtiles的版本。

如果是pbf矢量切片，那么metadata表必须包括这个数据：

- `json`(JSON字符串)：列出在矢量切片中出现的图层，以及这些图层中要素的名称、属性类型。



## 1.2 瓦片（Tiles）

### 预定义

mbtiles数据库必须包括一个叫`tiles`的表。

这个表必须包括4个数据：

- `zoom_level`（INTEGER）
- `tile_column`（INTEGER）
- `tile_row`（INTEGER）
- `tile_data`（BLOB）

创建这个表的语法是：

``` SQL
CREATE TABLE tiles (zoom_level integer, tile_column integer, tile_row integer, tile_data blob)
```

此数据库可以包含一个索引以有效访问该表：

``` SQL
CREATE UNIQUE INDEX tile_index on tiles (zoom_level, tile_column, tile_row);
```

### 内容

tiles表包含瓦片本身，以及用于定位它们的值。

`zoom_level`、`tile_column`和`tile_row`列必须遵循TMS规范来对瓦片进行编码，必须使用Web墨卡托切片。

注意，在TMS切片规则中的Y轴和通常在URL中使用的XYZ坐标系相反。例如，URL是`11/327/791`，那么对应`zoom_level=11`，`tile_column=327`，`tile_row=1256`.

其中，$1256=2^{11-1}-791$。

`tile_data`列必须包括二进制的图像或者矢量数据。

## 1.3 格网（Grids）

### 预定义

如果mbtiles储存有栅格瓦片，必须拥有`grids`和`grid_data`两张表。

grids表必须包含以下4列：

- `zoom_level`(INTEGER)
- `tile_column`(INTEGER)
- `tile_row`(INTEGER)
- `grid`(BLOB)

创建grids表的SQL语句是：

``` SQL
CREATE TABLE grids (zoom_level integer, tile_column integer, tile_row integer, grid blob);
```

grid_data表必须包含以下5列：

- `zoom_level`(INTEGER)
- `tile_column`(INTEGER)
- `tile_row`(INTEGER)
- `key_name`(TEXT)
- `key_json`(TEXT)

### 内容

如果`grids`表存在，那么必须包含UTFGrid数据，而且用gzip进行压缩。

如果`grids_data`表存在，必须包含格网键到值的映射关系，值是JSON对象。

# 2. 矢量数据集元数据

> 译者注：应该指的是矢量瓦片的规范

如果使用矢量瓦片，那么metadata表就要包括一个json数据，来表明矢量瓦片中有哪些图层，这些图层的要素有哪些属性。

如果存在`json`属性，则使用UTF-8的JSON对象表示。

## 2.1 矢量图层

`json`属性的值是一个JSON对象，必须包括`vector_layers`属性，这个属性的值是数组类型。

每一个数组元素通过下列属性描述了对应矢量图层是什么样的：

- `id`(字符串)：图层的id，引用在[MapBox矢量瓦片规范](https://github.com/mapbox/vector-tile-spec/tree/master/2.1#41-layers)中图层的`name`。
- `fields`(对象)：JSON对象，与被记录图层的属性类型一致。属性类型只能是`"Number"`、`"Boolean"`、`"String"`这三者之间。要素内不同类型的属性应是`"String"`类型的。

以上两个属性是必须的，以下几个属性是应该包含的：

- `description`(字符串)：人可阅读的描述
- `minzoom`(数字)：该图层应显示的最小缩放级别
- `maxzoom`(数字)：该图层应显示的最大缩放级别

minzoom必须≥瓦片数据集的minzoom，maxzoom必须≤瓦片数据集的maxzoom。

这些属性控制了某个图层在某一段分辨率（缩放级别）时的显示与隐藏，例如次要道路在低分辨率（低缩放级别）时就不应该出现了。

## 2.2 瓦片统计

`json`属性中的JSON对象可以包括`tilestats`属性，它的值是[mapbox-geostats](https://github.com/mapbox/mapbox-geostats#output-the-stats)仓库中描述的`geostats`对象。像矢量图层一样，它列出了瓦片数据集的图层、每个图层的属性，不过还列出了每个属性的具体值情况，例如范围等。

## 2.3 例子

从tiger数据中获取到的美国县级数据、道路数据的矢量切片数据，有以下元数据：

- `name`: `TIGER 2016`
- `format`: `pbf`
- `bounds`: `-179.231086,-14.601813,179.859681,71.441059`
- `center`: `-84.375000,36.466030,5`
- `minzoom`: `0`
- `maxzoom`: `5`
- `attribution`: `United States Census`
- `description`: `US Census counties and primary roads`
- `type`: `overlay`
- `version`: `2`
- `json`:

```JSON
{
    "vector_layers": [
        {
            "id": "tl_2016_us_county",
            "description": "Census counties",
            "minzoom": 0,
            "maxzoom": 5,
            "fields": {
                "ALAND": "Number",
                "AWATER": "Number",
                "GEOID": "String",
                "MTFCC": "String",
                "NAME": "String"
            }
        },
        {
            "id": "tl_2016_us_primaryroads",
            "description": "Census primary roads",
            "minzoom": 0,
            "maxzoom": 5,
            "fields": {
                "FULLNAME": "String",
                "LINEARID": "String",
                "MTFCC": "String",
                "RTTYP": "String"
            }
        }
    ],
    "tilestats": {
        "layerCount": 2,
        "layers": [
            {
                "layer": "tl_2016_us_county",
                "count": 3233,
                "geometry": "Polygon",
                "attributeCount": 5,
                "attributes": [
                    {
                        "attribute": "ALAND",
                        "count": 6,
                        "type": "number",
                        "values": [
                            1000508839,
                            1001065264,
                            1001787870,
                            1002071716,
                            1002509543,
                            1003451714
                        ],
                        "min": 82093,
                        "max": 376825063576
                    },
                    {
                        "attribute": "AWATER",
                        "count": 6,
                        "type": "number",
                        "values": [
                            0,
                            100091246,
                            10017651,
                            100334057,
                            10040117,
                            1004128585
                        ],
                        "min": 0,
                        "max": 25190628850
                    },
                    {
                        "attribute": "GEOID",
                        "count": 6,
                        "type": "string",
                        "values": [
                            "01001",
                            "01003",
                            "01005",
                            "01007",
                            "01009",
                            "01011"
                        ]
                    },
                    {
                        "attribute": "MTFCC",
                        "count": 1,
                        "type": "string",
                        "values": [
                            "G4020"
                        ]
                    },
                    {
                        "attribute": "NAME",
                        "count": 6,
                        "type": "string",
                        "values": [
                            "Abbeville",
                            "Acadia",
                            "Accomack",
                            "Ada",
                            "Adair",
                            "Adams"
                        ]
                    }
                ]
            },
            {
                "layer": "tl_2016_us_primaryroads",
                "count": 12509,
                "geometry": "LineString",
                "attributeCount": 4,
                "attributes": [
                    {
                        "attribute": "FULLNAME",
                        "count": 6,
                        "type": "string",
                        "values": [
                            "1- 80",
                            "10",
                            "10-Hov Fwy",
                            "12th St",
                            "14 Th St",
                            "17th St NE"
                        ]
                    },
                    {
                        "attribute": "LINEARID",
                        "count": 6,
                        "type": "string",
                        "values": [
                            "1101000363000",
                            "1101000363004",
                            "1101019172643",
                            "1101019172644",
                            "1101019172674",
                            "1101019172675"
                        ]
                    },
                    {
                        "attribute": "MTFCC",
                        "count": 1,
                        "type": "string",
                        "values": [
                            "S1100"
                        ]
                    },
                    {
                        "attribute": "RTTYP",
                        "count": 6,
                        "type": "string",
                        "values": [
                            "C",
                            "I",
                            "M",
                            "O",
                            "S",
                            "U"
                        ]
                    }
                ]
            }
        ]
    }
}
```

# 3. 未来的工作

之后的版本，metadata表将包括一个属性，来指明瓦片数据的压缩类型（如果存在瓦片数据）。

未来版本中，metadata表的`bounds`、`minzoom`、`maxzoom`属性是必须存在的。

