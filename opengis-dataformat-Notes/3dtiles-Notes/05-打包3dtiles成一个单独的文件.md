idea from [3dtiles-repo-issue89](https://github.com/CesiumGS/3d-tiles/issues/89)

# 原文部分翻译（部分意译）

我的想法很简单。

1. 只需要一个只有两列的表，key列存储相对于tileset.json的路径，content存储文件的blob
2. 压缩文件。像tileset.json或者b3dm文件一样，存入blob之前应先用gzip压缩。
3. `tileset.json`文件存储在同一个表内，与数据内容放一起就行

用这种格式写入关系数据库可以做很多事情，但是它的缺点就是太通用了，如果不尝试解析tileset.json，验证数据会比较难。

对于检索瓦片来说，它的效率也不高，因为key列是字符串，而不是索引号。



有一个更不错的选择，就是把切片的树形结构组织设计成一个数据库模式，见[#issue 92 Implicit tiling schemes](https://github.com/CesiumGS/3d-tiles/issues/92)。

例如，四叉树使用`x/y/z`这样的组织形式来当数据库的复合主键，这样查询速度会快一些。这样做会使得瓦片的组织在结构上优化一些。但是，仍需一个通用的表来存外部纹理或者其他的数据。

除了存tileset.json到数据库外，还可以用`metadata`表来存储元数据，即把tileset.json从json格式做成二维表的形式。

这么做就可以把大的tileset.json生成小的的子瓦片数据集了。



还有一个想法，就是把batchtable从瓦片中剥离，单独存表。这么做就可以做服务端查询和非可视化查询了。



# 官方小工具

https://github.com/AnalyticalGraphicsInc/3d-tiles-tools

这里提供了一个3dtiles小工具，使用[tilesetToDatabase](https://github.com/AnalyticalGraphicsInc/3d-tiles-tools/tree/master/tools#tilesettodatabase)功能可以把3dtiles简单地入一个后缀为`*.3dtiles`的SQLite3数据库里。



# 作为GeoPackage的扩展数据集

http://www.geopackage.org/extensions.html

http://www.compusult.net/html/OGC/3DTile_GeoPackage_Ext_Draft.html

（后续会补充入geopackage-Notes里）



# 社区实现

cesiumlab在此基础上扩展了clt文件（也是sqlite3），和最开头的想法是一致的，多了md5列和type列。