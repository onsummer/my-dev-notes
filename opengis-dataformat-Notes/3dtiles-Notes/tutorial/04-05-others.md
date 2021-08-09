此部分尚未纳入正式 3dTiles 规范。

除了 b3dm、i3dm、pnts以及复合类型 cmpt，其实还有一种尚未纳入规范的瓦片类型：二维矢量瓦片。

实际上，矢量瓦片已经有 MapBox 的实现了，但是 Cesium 并未兼容，需要自己写 DataSource 加载。

# 二维矢量瓦片：Vctr

这部分已经被官方团队废止了，不过在关闭分支前，我恰好收集过这种瓦片的定义，并且在 1.66版本（至少在这个版本我找到过） Cesium 源代码中是预先设置有这种类型的加载代码的，App目录也存在这种瓦片类型的 3dtiles。

我们可以拿来短暂的学习，并与MapBox提供的 矢量瓦片 对比。

## ① 文件头部定义

这回头部长达11个属性：

| 属性名                       | 字节长      | 类别         | 说明                        |
| ---------------------------- | ----------- | ------------ | --------------------------- |
| magic                        | 4byte，下同 | char[4]      | 标识符，字符串常量 `"vctr"` |
| version                      | /           | uint32，下同 | 版本，未指定，应该是1       |
| byteLength                   | /           | /            | 瓦片文件大小                |
| featureTableJSONByteLength   | /           | /            | 要素表JSON二进制字符串长    |
| featureTableBinaryByteLength | /           | /            | 要素表体二进制数据大小      |
| batchTableJSONByteLength     | /           | /            | 批量表JSON二进制字符串长    |
| batchTableBinaryByteLength   | /           | /            | 批量表体二进制数据大小      |
| polygonIndicesByteLength     | /           | /            | 复合多边形索引数据长度      |
| polygonPositionsByteLength   | /           | /            | 复合多边形坐标数据长度      |
| polylinePositionsByteLength  | /           | /            | 复合折线坐标数据长度        |
| pointPositionsByteLength     | /           | /            | 点坐标数据长度              |

## ② 猜测

要素表、批量表应该与之前的三种具体瓦片类似，只不过现在这个 beta 规范被废弃了，所以没有什么资料能考证。

最后几个应该是对二维数据的记录了，同样，没有文档比较难猜测。