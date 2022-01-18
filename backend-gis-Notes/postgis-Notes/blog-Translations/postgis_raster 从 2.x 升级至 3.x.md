postgis_raster 从 2.x 升级至 3.x

---

从 PostGIS 3.0 开始，对于栅格数据的支持就从 `postgis` 扩展中分离了，叫做 `postgis_raster`.

主要有两个原因：

- PostGIS 插件的栅格功能很多，有超过 150 多个函数和多个数据类型，对于没用到这些的用户可能会有些迷茫；
- gdal 库的占体积很大，很多只用 `postgis` 扩展的开发者希望减少它

虽然分离出栅格的部分让一部分开发者满意了，但是意味着从 2.x 升级到 3.x 的 PostGIS 就变得有点麻烦了，即使是有经验的用户也有可能搞砸。

本文将介绍 PostGIS 栅格模块升级的正确方法，即升级 2.x 的 PostGIS 到 3.x.

你可以用 psql 或 pgAdmin 或者任意一种 PostgreSQL 工具来运行下面的步骤。

无论你现在是什么版本的 PostGIS，你都应该先把 3.x 的 PostGIS 插件安装了，也无论你怎么安装的。

如果你是 2.4 或以下版本的

``` sql
-- 这一步仅版本＜ 2.5.4 
alter extension postgis update;

-- 其它 2.x 的都要做如下步骤：注意，要运行两次
select postgis_extensions_upgrade();
select postgis_extensions_upgrade();
```

随后，若你的数据库没有用到栅格相关的功能，没有包含栅格数据的表，那么可以用下面的语句删除栅格扩展：

``` sql
drop extension postgis_raster;
```

你可能想问，为什么 `select postgis_extensions_upgrade();` 这一条语句要跑两次，原因是跑第一条会将栅格部分从 `postgis` 扩展中分离出来，分离出函数和类型；跑第二条时，就能把这些函数和类型重新绑定至 `postgis_raster` 扩展中。

很遗憾，官方没能通过单个 pg 函数完成这一个过程，因为官方的作者忘记了具体是为什么就没写，貌似是因为 PostgreSQL 的扩展升级、安装以及创建一个新的扩展这些操作不能在同一个事务中进行。

PostgreSQL 13 移除了 `create extension ... from unpackaged` 的支持，增加了一些复杂性。因此，升级 13 或者更高版本的 PostgreSQL 之前最好就升级 PostGIS 3.x.