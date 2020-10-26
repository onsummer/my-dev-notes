# 1 命令程序

## ① psql命令

psql是一个可执行程序，位于pg安装目录的bin目录下，语法

``` SHELL
psql -h localhost -U <用户名> -d <数据库名> -p <端口号>
```

然后就会让你输入密码，登录后，命令提示符就会有这样的提示信息：

``` SHELL
<数据库名称>=#:
```

输入SQL语句和以下命令都可以。

### 查询数据库本身的操作

``` SQL
-- 列出所有数据库
\l

-- 切换数据库
\c <数据库名>

-- 查询所有表
\dt

-- 查看某个表的描述（列的类型）
\d <表名>

-- 使用内嵌vim编辑器写sql语句，能临时保存，可以执行
\e

-- 查询当前扩展
\dx

-- 截断、退出长文本显示
q
```

## ② pg_ctl命令

pg_ctl是一个可执行程序，位于pg安装目录的bin目录下。用它来查看版本或启动数据库

``` SHELL
# 查看pg版本
pg_ctl --version

# 启动数据库服务
# pg_ctl -D <路径>，如果配了PGDATA环境变量就不用加-D参数
pg_ctl -D D:\PGData
```



# 2 创建postgis命令

## ① 创建数据库

``` SQL
create database <数据库名>;
```

## ② 创建扩展

``` sql
-- create extension <扩展名>;
-- 大小写都可以，别忘了分号结尾

-- 3.0之后只用postgis扩展将仅支持矢量数据
create extension postgis;
-- 栅格扩展
create extension postgis_raster;
-- 拓扑扩展
create extension postgis_topology;
```

如果仅仅需要支持空间矢量数据，那么只需要第一个扩展即可。

## ③ 卸载扩展

和创建扩展一样，不列详细的了，列出语法

``` SQL
drop extension <扩展名>;
```

## ④ 升级、更改扩展

``` sql
-- alter extension <扩展名> update to "<版本号>";
alter extension postgis update to "3.0.1";
```



# 3 创建数据表命令

## ① 创建带有几何数据列的表

``` SQL
create table mytable (
	id serial primary key,
    geom geometry(point, 3857),
    name varchar(128)
);
```

## ② 创建索引

``` SQL
create index mytable_gix 
	on mytable
	using gist(geom);
```

## ③ 创建一个点

``` SQL
-- 使用EPSG:3857坐标系，创建一个0,0的点
insert into mytable (geom) values (
    st_geomfromtext('POINT(0 0)', 3857)
);
```

## ④ 查询举例：最近点查询

``` SQL
-- 使用st_geomfromtext()函数，搜索(1,2)这个坐标系是EPSG:3857的点10米内的点，返回id和name
select id, name
from mytable
where st_dwithin(
	geom,
    st_geomfromtext('POINT(1 2)', 3857),
    10
);
```

