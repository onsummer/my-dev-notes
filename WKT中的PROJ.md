参考资料：geotools帮助文档：https://docs.geotools.org/stable/javadocs/org/opengis/referencing/doc-files/WKT.html

# 1. 举例：EPSG 4326

``` 
GEOGCS["WGS 84",
    DATUM["WGS_1984",
        SPHEROID["WGS 84",6378137,298.257223563,
            AUTHORITY["EPSG","7030"]],
        AUTHORITY["EPSG","6326"]],
    PRIMEM["Greenwich",0,
        AUTHORITY["EPSG","8901"]],
    UNIT["degree",0.0174532925199433,
        AUTHORITY["EPSG","9122"]],
    AUTHORITY["EPSG","4326"]]
```

# 2. 常见关键词

## 2.1. GEOGCS

表示一个地理坐标系统。

语法：

```
GEOGCS["<name>", <datum>, <prime meridian>, <angular unit> {,<twin axes>} {,<authority>}]
```

参数：

- \<name\>：地理坐标系的名称
- \<datum>：[DATUM](#2.2. DATUM)
- \<prime meridian>：[PRIMEM](#2.5. PRIMEM)
- \<angular unit>：[UNIT](#2.6. UNIT)
- {\<authority>}：[AUTHORITY](#2.4. AUTHORITY)

## 2.2. DATUM

基准面。基于同一个椭球体，不同国家、地区可以有不同的基准面。

> 通常来说，椭球如果一样，那么两个不同的基准面的坐标应该是可以重合的？——存疑

语法：

```
DATUM["<name>", <spheroid> {,<to wgs84>} {,<authority>}]
```

参数

- "\<name>"：基准面名称
- \<spheroid>：[SPHEROID](#2.3. SPHEROID)
- \<authority>：[AUTHORITY](#2.4. AUTHORITY)

## 2.3. SPHEROID

椭球体，数学上是旋转椭球体方程定义的一个曲面（XOY椭圆绕Z旋转）。

语法：

```
SPHEROID["<name>", <semi-major axis>, <inverse flattening> {,<authority>}]
```

参数：

- "\<name>"：椭球体名称
- \<semi-major axis>：长半轴的半长（即长半径），通常就是赤道半径
- \<inverse flattening>：曲率的倒数
- \<authority>：[AUTHORITY](#2.4. AUTHORITY)

> ellipsoid 与此词在这里是一样的意思。

## 2.4. AUTHORITY

认证信息，通常是 EPSG 组织定义的一个 ID 信息。

带有 \<authority> 参数的都能拥有 EPSG ID，不仅仅是 地理坐标系统 和 投影坐标系统。

语法：

```
AUTHORITY["<组织名>", "ID号"]
```



## 2.5. PRIMEM

中央经线。

语法：

``` 
PRIMEM["<name>", <longitude> {,<authority>}]
```

参数：

- "\<name>"：中央经线名称
- \<longitude>：经度
- \<authority>：[AUTHORITY](#2.4. AUTHORITY)

## 2.6. UNIT

单位。

语法：

```
UNIT["<name>", <conversion factor> {,<authority>}]
```

参数

- "\<name>"：中央经线名称
- \<conversion factor>：转换系数

举例：

``` 
UNIT["DMSH",0.0174532925199433,AUTHORITY["EPSG","9108"]]
```



## 2.7. PROJCS

投影坐标系统。

语法：

```
PROJCS["<name>", <geographic cs>, <projection>, {<parameter>,}* <linear unit> {,<twin axes>}{,<authority>}]
```

参数：

- \<name>：坐标系名称
- \<geographic cs>：[GEOGCS](#2.1. GEOGCS)
- \<projection>：[PROJECTION](#2.8. PROJECTION)
- {\<parameter>}*：0~N个，[PARAMETER](#2.11. PARAMETER)
- \<linear unit>：线性单位，[UNIT](#2.6. UNIT)
  - 例如 `UNIT["metre",1,AUTHORITY["EPSG","9001"]]`

## 2.8. PROJECTION

投影类型。

语法：

``` 
PROJECTION["<name>" {,<authority>}]
```

参数：

- \<name>：名称
- \<authority>：[AUTHORITY](#2.4. AUTHORITY)



## 2.9. TOWGS84

转换到 WGS84 的七参数。

语法：

``` 
TOWGS84[x, y, z, u, v, w, s]
```

## 2.10. AXIS

轴定义。

语法：

```
AXIS["<name>", NORTH | SOUTH | EAST | WEST | UP | DOWN | OTHER]
```

举例：

`AXIS["Y",NORTH]`

给定轴的名称、朝向。

## 2.11. PARAMETER

一般参数，键值对。