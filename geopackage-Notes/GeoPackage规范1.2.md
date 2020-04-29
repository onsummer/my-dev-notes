# 第一章 Base(基础)

本节中指出的必选功能分别为`Options(第二章，选项)`和`Registered Extensions (Normative) (附录F，注册的扩展)`中各个子项和各种指出的扩展的基础。

在这个标准中，全部类似`gpkg_*`命名的表、视图以及全部分片的用户数据表应指明表的类型、列的数据类型。

除了指定的列外，任意要素用户数据表还应有别的列。

所有的表、视图、列、触发器、约束名称都用小写。

## 1.1 核心(Core)

每个GeoPackage和GeoPackage SQLite均应实现本部分定义的核心功能。

### 1.1.1 SQLite容器(SQLite Container)

[bb了一堆没有什么用的，大致是说GeoPackage是一种基于SQLite的实现]。

#### 1.1.1.1 数据(Data)

- 文件格式

  - 要求1

    一个GeoPackage是一个SQLite3文件，前16字节应为ASCII字符串"SQLite format 3"。

  - 要求2

    GeoPackage应在SQLite数据库标头的“ application_id”字段中应包含0x47504B47（ASCII中为“ GPKG”）值，以指示它是GeoPackage。

    GeoPackage应在SQLite数据库头的“user_version”字段中包含适当的值以指示其版本。 该值应为整数，包括主版本，两位副版本和两位错误修正。 对于GeoPackage版本1.2，该值为000027D8（10200的十六进制值）。

> 一个GeoPackage文件最大尺寸为140TB。实际上，由文件系统决定。例如移动设备的存储卡为FAT32格式，最大只能存4GB。

- 文件扩展名

  - 要求3

    为"*.gpkg"。

- 文件内容

  - 要求4

    GeoPackage应仅包含在此编码标准（Features小节，Tiles小节和Attributes小节）中指定的数据元素（tables表，columns列或values值）和SQL构造（views视图，constraints约束或triggers触发器）。

    扩展GeoPackages可以包含通过Extension Mechanism小节指定的其他数据元素和SQL结构。

  - 要求5

  - 表1 GeoPackage 数据类型

    | 数据类型              | 大小和描述                                             |
    | --------------------- | ------------------------------------------------------ |
    | BOOLEAN               | 布尔值表达true或者false。作为INTEGER存储，仅存0或者1。 |
    | TINYINT               | 8bit有符号的                                           |
    | SMALLINT              | 16bit有符号的                                          |
    | MEDIUMINT             | 32bit有符号的                                          |
    | INT, INTEGER          | 64bit有符号的                                          |
    | FLOAT                 | 32bit IEEE浮点数                                       |
    | DOUBLE, REAL          | 64bit IEEE浮点数                                       |
    | TEXT{(maxchar_count)} |                                                        |
    | BLOB{(max_size)}      |                                                        |
    | <geometry_type_name>  | 作为"几何编码(Geometry Encoding)小节"                  |
    | DATE                  |                                                        |
    | DATETIME              |                                                        |

- 文件整合(File Integrity)

  - 要求6
  - 要求7

#### 1.1.1.2 API

- SQL
  - 要求8

###　1.1.2 坐标系统

#### 1.1.2.1 数据

- 表定义

  - 要求10

    一个GeoPackage应包括一个名为`gpkg_spatial_ref_sys`表。GeoPackage的此表定义在本小节以及本小节下的两个表格中：`Spatial Ref Sys Table Definition`、`gpkg_spatial_ref_sys Table Definition SQL`
  
  下方要介绍的`gpkg_spatial_ref_sys`表格， 是“简单要素SQL介绍”部分中介绍的简单要素的标准SQL定义的第一部分。坐标系统的定义将被`gpkg_contents`和`gpkg_geometry_columns`表格引用，用来指示矢量或栅格数据在地球表面的位置。
  
  下表即坐标系统表格的定义：
  
  | 列名                     | 列数据类型 | 列描述                                     | 是否可空 | 是否主键 |
  | ------------------------ | ---------- | ------------------------------------------ | -------- | -------- |
  | srs_name                 | 文本       | 人类可识别的名字                           | 否       |          |
  | srs_id                   | INTEGER    | gpkg中唯一可识别的id号                     | 否       | 是       |
  | organization             | 文本       | 大小写不敏感，用于标定坐标系统出自哪个组织 | 否       |          |
  | organization_coordsys_id | INTEGER    | 由上个属性所代表的组织定义的id             | 否       |          |
  | definition               | 文本       | WKT文本                                    | 否       |          |
  | description              | 文本       | 人类可识别的描述                           | 是       |          |
  
  - 要求11
  
      `gpkg_spatial_ref_sys`表不会把上面的属性都保存下来，有一些属性是可以用默认值或者为空的。
  
      例如，srs_id是4326，就对应了EPSG定义的WGS84坐标系。
  
      srs_id是-1时，代表未知的空间直角坐标系。
  
      srs_id是0时，代表未知的地理坐标系统。
  
      | srs_name | srs_id | organization | organization_coordsys_id | definition | description |
      | -------- | ------ | ------------ | ------------------------ | ---------- | ----------- |
      | 任意     | 4326   | EPSG或epsg   | 4326                     | 任意       | 任意        |
      | 任意     | -1     | /            | -1                       | 未定义     | 任意        |
      | 任意     | 0      | /            | 0                        | 未定义     | 任意        |
  
  - 要求12
  
      `gpkg_spatial_ref_sys`表记录了gpkg所有数据所用的坐标系。
  
      

### 1.1.3 内容

`gpkg_contents`表记录的是gpkg中所有地理数据的总列表。它提供了一个存在此gpkg内的所有地理数据的列表，这个列表可供应用程序来显示给用户看，以便查看或更新数据。

#### 1.1.3.1 数据

##### 表定义

- 要求13

    一个gpkg必须包括一个`gpkg_contents`表格，每个表格的预定义见以下两表。

    | 列名        | 列数据类型 | 描述                                                         | 是否可空 | 默认值                               | KEY  |
    | ----------- | ---------- | ------------------------------------------------------------ | -------- | ------------------------------------ | ---- |
    | table_name  | 文本       | 实际数据表的名称（瓦片、要素、属性等）                       | no       |                                      | 主键 |
    | data_type   | 文本       | 数据表中的数据类型                                           | no       |                                      |      |
    | identifier  | 文本       | 数据表的人类可识别的名称                                     | 可空     |                                      | 唯一 |
    | description | 文本       | 数据表人类可识别的描述                                       | 可空     | ''                                   |      |
    | last_change | DATE_TIME  | 上次修改的时间，使用ISO 8601规范                             | no       | strftime('%Y-%m-%dT%H:%M:%fZ','now') |      |
    | min_x       | DOUBLE     | 数据表的四至最小x，东方向的值，或者经度。如果是瓦片数据集，则非常有用。 |          |                                      |      |
    | min_y       | DOUBLE     | 数据表的四至最小y，北方向的值，或者纬度。如果是瓦片数据集，则非常有用。 |          |                                      |      |
    | max_x       | DOUBLE     | 数据表的四至最大x，东方向的值，或者经度。如果是瓦片数据集，则非常有用。 |          |                                      |      |
    | max_y       | DOUBLE     | 数据表的四至最大y，北方向的值，或者纬度。如果是瓦片数据集，则非常有用。 |          |                                      |      |
    | srs_id      | INTEGER    | 引用gpkg_spatial_ref_sys.srs_id。如果data_type是要素，还要匹配gpkg_geometry_columns.srs_id。如果是瓦片，则要匹配gpkg_tile_matrix_set.srs_id。 |          |                                      |      |



##### 表数据值

- 要求14

    `gpkg_contents`表中`table_name`列的值，应该包括SQLite表名和视图名。

`data_type`标识了数据表的类型，可以是'features'、'attributes'、'tiles'中的一种，见第二章，也可以是自定义的表类型，如果你有扩展gpkg的能力。

- 要求15

    讲`last_change`的，就是注意这个时间属性列是UTC时间的，使用strftime函数`'%Y-%m-%dT%H:%M:%fZ'`来定义当前时间。

四至是数据的四至，不一定是最小包围，可以比最小包围大。单位与坐标系一样。

- 要求16

    `srs_id`列的值要与`gpkg_spatial_ref_sys`表的`srs_id`一样。

## 1.2 译者注

主要讲了2张全局表。

- gpkg_spatial_ref_sys

    坐标系表格，定义了所有数据用到的坐标系。

- gpkg_contents

    数据汇总表，记录了所有数据表的元数据。

还指明了gpkg的物理文件格式（SQLite），数据类型（字节大小）等信息。

# 第二章 Options(可选项)

本章基于第一章展开。

本章每个小节定义了gpkg数据库中不可再分的数据，每一份数据被称为**可选项**。

一个gpkg数据库可以允许一个或者多个可选项，如果没有那就算了。

gpkg数据库至少包括一个数据表，可以是上述四种类型的任意一个（要素表，瓦片表，普通属性表，扩展表）。

## 2.1 要素表

### 2.1.1 简单要素SQL简介



### 2.1.2 内容



### 2.1.3 几何编码

#### 数据

##### 二进制格式

- 要求19



二进制格式：

```C
GeoPackageBinaryHeader {
    byte[2] magic = 0x4750; ①
    byte version; ②
    byte flags; ③
    int32 srs_id;
    double[] envelope; ④
}
StandardGeoPackageBinary {
    GeoPackageBinaryHeader header; ⑤
    WKBGeometry geometry; ⑥
}
```





### 2.1.4 SQL几何类型

#### 数据

##### 核心类型





### 2.1.5 几何属性列

#### 数据

##### 表定义

- 要求21



几何列定义：

| 列名               | 列数据类型 | 描述 | 是否可空 | 键类型 |
| ------------------ | ---------- | ---- | -------- | ------ |
| table_name         | 文本       |      | 不可     | PK,FK  |
| column_name        | 文本       |      | 不可     | PK     |
| geometry_type_name | 文本       |      | 不可     |        |
| srs_id             | INTEGER    |      | 不可     | FK     |
| z                  | TINYINT    |      | 不可     |        |
| m                  | TINYINT    |      | 不可     |        |



##### 表数据值



### 2.1.6 矢量要素数据表

#### 数据

##### 表定义



##### 表数据值





## 2.2 瓦片表

### 2.2.1 瓦片矩阵简介



### 2.2.2 内容

#### 数据

内容表 - 瓦片行



### 2.2.3 缩放级别



#### 数据

两倍缩放



### 2.2.4 瓦片编码——PNG





### 2.2.5 瓦片编码——JPEG





### 2.2.6 瓦片矩阵数据集

#### 数据

##### 表定义



##### 表数据值



### 2.2.7 瓦片矩阵

#### 数据

##### 表定义



##### 表数据值





### 2.2.8 瓦片金字塔数据表

#### 数据

##### 表定义



##### 表数据值





## 2.3 扩展表

### 2.3.1 简介

略

### 2.3.2 扩展

#### 数据

##### 表定义

- 要求58

    一个gpkg数据库可以包含一个`gpkg_extensions`表。如果这个表存在，则需要遵守以下几个表格的规范，即必须有这些属性（列），且不能更改它们的名称、类型，但是可以加新的列。

gpkg中的`gpkg_extensions`表用于指明某个数据表或某张表的某些属性列的扩展数据。

| 列名           | 列数据类型 | 列描述 | 是否可空 | 主键           |
| -------------- | ---------- | ------ | -------- | -------------- |
| table_name     | 文本       |        | 是       | Jointly Unique |
| column_name    | 文本       |        |          |                |
| extension_name | 文本       |        |          |                |
| definition     | 文本       |        |          |                |
| scope          | 文本       |        |          |                |



##### 表数据值





## 2.4 普通属性表

### 2.4.1 简介

非空间数据表，即没有几何属性。在gpkg中，这种数据被存作“普通属性表”。这些表可能会存储地理编码、ID之类的数据，这种表格可以与其他关联的属性表、要素表、瓦片表进行结合。

例如：

- 气象站的气象读数
- 流量表的流量读数
- 嵌入式公路传感器的交通量
- 顾客列表
- 交货站
- 订单表

### 2.4.2 内容

- 要求118

    `gpkg_contents`表中`data_type`属性应为`attributes`，以标识某行所指向的数据。

### 2.4.3 属性数据表

#### 数据

##### 表定义

属性数据集是普通属性表中的行。（GeoPackage可以不包含任何普通属性表。GeoPackage中的普通属性表可以为空。）

- 要求119

    略

id属性允许某行属性数据集通过`gpkg_metadata_reference`表中的rowid值链接到`gpkg_metadata`表中的元数据记录，如下面的子数据一节所述。

| 列名              | 列数据类型   | 列描述   | 是否可为空 | 主键 |
| ----------------- | ------------ | -------- | ---------- | ---- |
| id                | INTEGER      | 顾名思义 | no         | 是   |
| text_attribute    | 文本         | 顾名思义 | 可空       |      |
| real_attribute    | REAL         | 顾名思义 | 可空       |      |
| boolean_attribute | 布尔         | 顾名思义 | 可空       |      |
| raster_or_photo   | 二进制大文件 | 顾名思义 | 可空       |      |



##### 表数据值











# 第三章 Security Considerations(安全考虑)



