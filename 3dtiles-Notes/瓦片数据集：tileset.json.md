tileset.json

# 扩展名和MIME类型

瓦片数据集用`.json`后缀名，使用`application/json`MIME类型。

瓦片文件使用二进制文件，可以没有扩展名。

瓦片数据集样式文件使用`.json`后缀名，使用`application/json`MIME类型。

# JSON编码

使用没有BOM的UTF-8编码，所有在规范中定义的字符串，都使用ASCII编码，JSON的键名必须唯一。

# URIs

外部引用的资源使用规范`RFC 3986`，对于嵌入的二进制资源使用`RFC 2397`规范。

当资源是相对的时候，总是相对瓦片数据集文件。

# 计量单位

线性距离都是米。所有的角度单位是弧度制。

# 坐标系统

使用右手笛卡尔坐标系，即z轴朝上。

在GIS方面，使用WGS84椭球体，对应的坐标系的EPSG为4978，但是这并不是必须的。有些模型使用它自己的模型坐标系。

可以使用瓦片数据集的`transform`属性来应用一个从局部坐标系到全局坐标系的转换。

边界范围使用EPSG：4979这个地理坐标系来限定。

# EPSG4979和4978

来看看他们的OGC WKT

``` bash
GEOCCS["WGS 84",
    DATUM["World Geodetic System 1984",
        SPHEROID["WGS 84",6378137.0,298.257223563,
            AUTHORITY["EPSG","7030"]],
        AUTHORITY["EPSG","6326"]],
    PRIMEM["Greenwich",0.0,
        AUTHORITY["EPSG","8901"]],
    UNIT["m",1.0],
    AXIS["Geocentric X",OTHER],
    AXIS["Geocentric Y",EAST],
    AXIS["Geocentric Z",NORTH],
    AUTHORITY["EPSG","4978"]]
```

``` BASH
GEOGCS["WGS 84",
    DATUM["World Geodetic System 1984",
        SPHEROID["WGS 84",6378137.0,298.257223563,
            AUTHORITY["EPSG","7030"]],
        AUTHORITY["EPSG","6326"]],
    PRIMEM["Greenwich",0.0,
        AUTHORITY["EPSG","8901"]],
    UNIT["degree",0.017453292519943295],
    AXIS["Geodetic latitude",NORTH],
    AXIS["Geodetic longitude",EAST],
    AXIS["Ellipsoidal height",UP],
    AUTHORITY["EPSG","4979"]]
```

除了三个轴、单位还有EPSG编号外，这两个坐标系没有什么定义上的不同，椭球体均采用的是WGS84椭球。

4979坐标系使用的是十进制度数，规定经度轴是南北朝向（北为正方向），规定纬度轴是东西朝向（东为正方向），规定相对于椭球表面的高度为上方向。

4978坐标系使用的是米为单位，规定南北方向是Z轴，规定东西方向是Y轴，其他方向是X轴。（这一段不太理解，需要找更多资料学习）

# 概念定义

## ①瓦片



### a.几何误差



### b.细化



#### 替换



#### 附加



### c. 边界框（Bounding Volumes）



#### 范围（Region）



#### 盒子（box）



#### 球体（Sphere）



### d. Viewer request volume



### e. 转换（Transforms）

#### 瓦片转换



#### glTF转换



##### glTF 节点树状结构



##### y朝上至z朝上



#### 例子



#### 代码实现案例（并不是规范内容）



### f. 瓦片的独立JSON文件



## ② 瓦片数据集的JSON文件



### a. 外部的瓦片数据集



### b. 边界框的空间连续性



### c. 空间数据结构



#### c1. 四叉树



#### c2. k-d 树



#### c3. 八叉树



#### c4. 网格结构



## ③ 指定扩展和附加功能

### a. extensions



### b. extras



# 瓦片文件规范

略

# 声明式样式规范

略

# 属性参考

- Tileset
    - Asset
    - Bounding Volume
    - Extension
    - Extras
    - Properties
    - Tile
        - Content

---

## ① Tileset

瓦片数据集。除了以下列举的属性外，其他属性均不允许。（译者注：不知道是程序不识别还是读取失败？）

| 属性名            | 数据类型   | 描述                                                         | 是否可选 |
| ----------------- | ---------- | ------------------------------------------------------------ | -------- |
| asset             | object     | 该瓦片数据集的元数据。                                       | √必选    |
| properties        | any        | 每个要素的元数据。                                           | 可选     |
| geometricError    | number     | 使用单位为米的值来标定此瓦片数据集是否渲染。在运行时，几何误差用于计算屏幕空间误差（SSE），即以像素为单位的误差。要求值≥0。 | √必选    |
| root              | object     | 瓦片数据集中的顶层瓦片。                                     | √必选    |
| extensionUsed     | 字符串数组 | 此瓦片数据集中的扩展数据可能在别的地方用到的数据的名称列表。 | 可选     |
| extensionRequired | 字符串数组 | 瓦片数据集中用于辅助加载扩展数据的名称列表。                 | 可选     |
| extensions        | object     | 特殊扩展所需数据。                                           | 可选     |
| extras            | any        | 与应用程序有关的数据                                         | 可选     |

## ② Asset

'asset'属性是瓦片数据集中的顶层属性。



## ③ Bounding Volume



## ④ Extension



## ⑤ Extras



## ⑥ Properties



## ⑦ Tile



## ⑧ Tile Content



# 许可

略。