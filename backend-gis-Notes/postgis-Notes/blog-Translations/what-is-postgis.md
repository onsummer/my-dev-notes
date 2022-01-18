> 这篇东西算是复习，了解 PostGIS 的基本构成与官方定义

# 1. 介绍

## 是什么

PostGIS 是 PostgreSQL 数据库的一个扩展插件，它是开源的，使用 GPLv2 协议。

## 有什么用

在数据表中增加了地理对象的类型支持，还添加了大量操作这些空间对象的函数、运算符和索引系统。

## 有什么功能

PostGIS 提供：

- 对矢量数据和栅格数据均提供了处理、分析的 SQL 函数，支持拼接、切割、形变、重分类、聚合等操作；
- 栅格图像的处理方法；
- 能通过 SQL 调用的栅格、矢量数据坐标重投影函数；
- GUI 程序或命令行程序来导入、导出 shp 矢量数据，并且通过第三方工具以支持更多格式；
- 命令行程序来导入多种标准的栅格数据：GeoTiff、NetCDF、PNG、JPG 等
- 能通过 SQL 调用的，能渲染、导入 KML、GML、GeoJSON、GeoHash、WKT 等标准文本类型的矢量数据的函数
- 能通过 SQL 语句将栅格渲染至各种格式（GeoTiff、PNG、JPG、NetCDF 等）
- 矢量或栅格操作函数，包括按区域伸缩栅格像元值、局域统计、按矢量图形裁剪栅格、矢量化栅格等
- 3D 对象支持，包括空间索引等函数
- 网络拓扑支持
- 其它



## 由何而来

PostGIS 是用 C 语言写的，所以它可以用一些 C/C++ 的库。它依赖于：

- [GEOS](http://trac.osgeo.org/geos) 库，提供几何图形处理算法
- [Proj.4](https://trac.osgeo.org/proj/) 库，提供坐标重投影函数
- [GDAL](http://gdal.org/) 库，提供栅格数据格式支持和处理手段
- [LibXML2](http://www.xmlsoft.org/) 库，用于 XML 文档的解析
- [JSON-C](https://github.com/json-c/json-c) 库，用于 JSON 的解析
- [SFCGAL](http://www.sfcgal.org/) 库，提供额外的 3D 图形地理处理算法

它遵循 OGC 的 [《简单要素关于SQL的规范》](http://www.opengeospatial.org/standards/sfs)来实现。



## 附带了什么工具

使用空间数据库，或者说任何数据库，有几个关键的操作：数据的导入导出。下面有几个工具要介绍：

- 命令行工具，shp2pgsql、pgsql2shp、raster2pgsql
- GUI 工具，shp2pgsql-gui，有些分发版本并没有，Windows 版本一般都有
- GDAL 有关工具和库，它是处理空间数据的利器，比较难啃，但是值得挑战



# 2. 与 PostGIS 类似、相关的 PostgreSQL 扩展

主要有：

- [pgRouting](http://pgrouting.org/)，要配合 PostGIS 一起用，扩充了网络分析功能，例如最短路径分析等
- [ogrfdw](https://github.com/pramsey/pgsql-ogr-fdw)，基于 GDAL/OGR 的外部数据包装器，意思就是允许 pg 读取其它数据源为数据表；其中矢量数据将转换为 PostGIS 的几何类型
- [pgpointcloud](https://github.com/pgpointcloud/pointcloud)，用于在 PostgreSQL 中存储点云数据，附有点云类型与 PostGIS 几何类型之间相互转换的功能



# 参考文档

- [PostGIS Development](http://postgis.net/development/)
- [PostGIS Feature List](http://postgis.net/features/)