# 1 说明

jsts 完全就是根据其老妈 jts 的 java 包结构移植的，除了部分分析功能需要额外注意外，基本上所有的子模块的根路径位于 `jsts/org/locationtech/jts` 模块下。

## Geometry 类

Geometry 类符合 OGC 简单要素规范的设计。它有若干个子类，例如点线面等。

Geometry 在 JTS 上有非常多实用的空间分析函数：

```
buffer, buffer, buffer, compareTo, compareTo, contains, convexHull, copy, coveredBy, covers, crosses, difference, disjoint, distance, equals, equals, equalsExact, equalsNorm, equalsTopo, geometryChanged, getArea, getCentroid, getEnvelope, getEnvelopeInternal, getFactory, getGeometryN, getInteriorPoint, getLength, getNumGeometries, getPrecisionModel, getSRID, getUserData, hashCode, intersection, intersects, isRectangle, isValid, isWithinDistance, norm, overlaps, relate, relate, setSRID, setUserData, symDifference, toString, toText, touches, union, union, within
```

但是不见得所有的都在 `JSTS` 中有，见第 3 节的 buffer 举例。

> turf 的分析函数在特定条件下是计算失败的（已验证），所以我才不得不求助于 JSTS



# 2 安装

``` sh
pnpm add jsts && pnpm add @types/jsts --save-dev

# or
npm install jsts && npm install @types/jsts --save-dev
# or
yarn add jsts && yarn add @types/jsts --save-dev
```

@types/jsts 是类型提示库



# 3 使用

## 以 buffer 为例

``` js
import JSTSWKTReader from 'jsts/org/locationtech/jts/io/WKTReader'
import JSTSGeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter'
import JSTSBufferOp from 'jsts/org/locationtech/jts/operation/buffer/BufferOp'

const wkt = `POINT (0 0)`
const bufferCenter = new JSTSWKTReader().read(wkt)
const bufferResult = JSTSBufferOp.bufferOp(
  bufferCenter,
  this.bufferRadius
) // instanceof Geometry

const bufferResultGeoJSON = new JSTSGeoJSONWriter().write(bufferResult)
```



# 4 JTS 文档

http://locationtech.github.io/jts/javadoc/