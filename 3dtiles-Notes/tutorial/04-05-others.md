此部分尚未纳入正式 3dTiles 规范。

除了 b3dm、i3dm、pnts以及复合类型 cmpt，其实还有一种尚未纳入规范的瓦片类型：二维矢量瓦片。

实际上，矢量瓦片已经有 MapBox 的实现了，但是 Cesium 并未兼容，需要自己写 DataSource 加载。

# 二维矢量瓦片：Vctr