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

这个表必须要有name和value两个文本类型的列。

### 内容

metadata表使用键值对存储，必须包括以下两行

- `name`(文本)：瓦片数据集人类可识别的名称
- `format`(文本)：单个瓦片的格式：pbf、jpg、png、webp或IETF媒体类型中的一种。

`pbf`是一种gzip压缩格式，是Mapbox的矢量瓦片格式。

metadata表应包括下列4个数据：

- `bounds`
- `center`
- `minzoom`
- `maxzoom`

metadata表可以包括以下4个数据：

- `attribution`
- `description`
- `type`
- `version`

如果是pbf矢量切片，那么metadata表必须包括这个数据：

- `json`



## 1.2 瓦片

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

## 1.3 栅格

### 预定义



### 内容



# 2. 矢量数据集元数据

> 译者注：应该指的是矢量瓦片的规范

如果使用矢量瓦片，那么metadata表就要包括一个json数据，来表明矢量瓦片中有哪些图层，这些图层的要素有哪些属性。

如果存在json行，则使用UTF-8的JSON对象表示。

## 2.1 矢量图层



## 2.2 瓦片统计



## 2.3 例子



# 3. 未来的工作

之后的版本，metadata表将包括一个属性，来指明瓦片数据的压缩类型（如果存在瓦片数据）。

未来版本中，metadata表的`bounds`、`minzoom`、`maxzoom`属性是必须存在的。

