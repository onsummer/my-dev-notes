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

    一个GeoPackage应包括一个名为`gpkg_spatial_ref_sys`表。GeoPackage的此表定义在本小节以及本小姐下的两个表格中：`Spatial Ref Sys Table Definition`、`gpkg_spatial_ref_sys Table Definition SQL`





# 第二章 Options(可选项)

## 2.1 要素

## 2.2 瓦片

## 2.3 扩展模式

## 2.4 属性



# 第三章 Security Considerations(安全考虑)



