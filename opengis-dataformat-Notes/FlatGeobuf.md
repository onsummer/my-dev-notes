# FlatGeobuf

一种为地理图形数据进行二进制编码的格式，基于 [flatbuffers]()，它能容纳 OGC 发布的 Simple Features（简单要素）规范下的数据。

本编码格式受到 [geobuf](https://github.com/mapbox/geobuf) 和 [flatbush](https://github.com/mourner/flatbush) 的启发。为了简单起见，此编码特地不支持随机写入。此编码格式使用希尔伯特R树（Hilbert R-Tree）作为数据结构，所以其使用范围框（Bounding Box）来进行空间检索的速度是非常快的。对于此编码格式来说，空间索引不是必须的，以便数据能以文件流的形式高效率地写入，以及适配不需要空间过滤（即空间检索）的情况。

设计目标：大数据量的静态数据要比传统格式快，且对于数据量、内容上没有大小的限制，并且适合流式或随机访问。

网站 [switchfromshapefile.org](http://switchfromshapefile.org/) 介绍了传统格式（尤其是 shapefile）的更多比对信息，且提供了一些替代方案，同时也提供了替代方案的存在缺点（例如，不适合流式传播）。

`FlatGeobuf` 是开源的，使用 `BSD 2-Clause License` 协议。

> 译者注
>
> 所谓流式传输，即可以一边通过 HTTP 传输数据，一边解析并可视化，而不必等待一个 fgb 文件全部请求到前端再做绘制，网络传过来多少数据，前端就画多少，极大提升单文件显示的体验。

## 例子（可能要魔法上网）

- [流式传输例子](https://observablehq.com/@bjornharrtell/streaming-flatgeobuf)
- [OpenLayers 例子](https://flatgeobuf.org/examples/openlayers/)
- [Leaflet 例子](https://flatgeobuf.org/examples/leaflet)



## 规格

![layout](attachments/layout.svg)

- MB：魔法字符，指示此文件用，即 `0x6667620366676200`
- H：头部信息
- I：（可选）被打包的静态希尔伯特R树 索引数据。
- DATA：要素数据

在 fgb 文件中，任何 64 位 flatbuffer 数据值（例如坐标数据）必须进行 8字节对齐，以便直接进行内存访问。

任何字符串值假定其编码为 UTF-8。



## 性能

从 OSM 上下载的一份 shapefile 文件，约 90 万条线要素，选取五种格式的各方面性能比对如下表：

|                  | Shapefile | GeoPackage | FlatGeobuf | GeoJSON | GML    |
| ---------------- | --------- | ---------- | ---------- | ------- | ------ |
| 读取完整数据     | 100%      | 102%       | 46%        | 1500%   | 890%   |
| 使用空间索引读取 | 100%      | 94%        | 71%        | 70500%  | 39900% |
| 写入完整数据     | 100%      | 77%        | 39%        | 390%    | 320%   |
| 带空间索引写入   | 100%      | 158%       | 65%        | -       | -      |
| 文件大小         | 100%      | 72%        | 77%        | 120%    | 210%   |

此测试使用 GDAL 的 FlatGeobuf 驱动，设置读取参数为 `ogrinfo -qq -oo VERIFY_BUFFERS=NO` 进行循环重复读取数据。对于文件写入的测试中，使用 `ogr2ogr` 以及分别使用参数 `-lco SPATIAL_INDEX=NO` 和 `-lco SPATIAL_INDEX=YES` 将原始数据转换成新文件。

在空间索引的测试项中，只选取了一个比较小的范围框，它范围内仅有 1204 个要素，仅仅是为了测试空间索引的性能。

使用一份由 251万多个多边形的数据来进行性能测试，结果如下表：

|                  | Shapefile | GeoPackage | FlatGeobuf |
| ---------------- | --------- | ---------- | ---------- |
| 读取完整数据     | 100%      | 23%        | 12%        |
| 使用空间索引读取 | 100%      | 31%        | 26%        |
| 写入完整数据     | 100%      | 95%        | 63%        |
| 以空间索引写入   | 100%      | 107%       | 70%        |
| 文件大小         | 100%      | 77%        | 95%        |



## 特性

- 在 JavaScript、TypeScript、C++、C#、Java、Rust 已有实现
- 高效率的 IO 表现（包括流式和随机）
- [GDAL/OGR 驱动](https://gdal.org/drivers/vector/flatgeobuf.html) 支持
- [GeoServer WFS 输出格式](https://docs.geoserver.org/latest/en/user/community/flatgeobuf/index.html) 支持



## 程序/库支持

- [Fiona](https://fiona.readthedocs.io/)（1.8.18 以上）
- GDAL（3.1 及以上）
- Geo Data Viewer（VSCode 插件）（2.3 及以上）
- GeoServer（2.17及以上）
- GeoTools（23.0及以上）
- QGIS（3.16及以上）



## 文档

### TypeScript / JavaScript

[API 文档](http://unpkg.com/flatgeobuf/dist/doc/modules/flatgeobuf.html)

#### 预打包（适用于浏览器）

- [flatgeobuf.min.js](https://unpkg.com/flatgeobuf/dist/flatgeobuf.min.js) 包含了通用模块
- [flatgeobuf-geojson.min.js](https://unpkg.com/flatgeobuf/dist/flatgeobuf-geojson.min.js) 包含了 geojson 模块
- [flatgeobuf-ol.min.js](https://unpkg.com/flatgeobuf/dist/flatgeobuf-ol.min.js) 包含了 openlayers 模块

### NodeJs 用法

查看 [示例](https://github.com/flatgeobuf/flatgeobuf/tree/master/examples/node)。

## TODO

- Java 索引支持
- C 语言支持
- Go 语言支持



## 问答

### 为什么不用 WKB 几何编码？

它不是 8字节对齐的编码。所以，它没有复制完整的文件之前，最好不要用它。

### 为什么不用 Protobuf？

性能和随机读、流式读的原因。

### 为什么我用 GDAL 没有达到期望的性能表现？

GDAL 的操作，默认假设数据是不可信的，会进行数据验证以确保操作安全性。如果你相信你的数据，想要一个最大的性能表现，请设置参数 `VERIFY_BUFFERS` 为 NO。

### 与矢量瓦片比较呢？

FlatGeobuf 与矢量瓦片并无竞争关系。矢量瓦片十分适合渲染，但是它是有损格式，而且在创建成本上比较高。FlatGeobuf 是无损格式，如果不需要空间索引数据，数据的写入（创建）是非常快的。

# 译者注

## 优点

- 单文件
- 支持R树的空间索引，带索引的数据读取性能高
- 支持流式传输
- 无损格式
- 文件体积相对不大
- 多编程语言、多软件已支持



## 缺点

- 不支持像 GeoPackage 格式一样有扩展能力
- 几何与属性数据并未分离，若能分离，几何数据可进一步优先传输并极大提高渲染速度
- 创建文件时若使用空间索引，效率上可能会有所打折（但是也比传统格式快）
- 文件体积较之于 GeoPackage 格式无明显优势，没有使用信息压缩算法
- 编码规范文档缺乏