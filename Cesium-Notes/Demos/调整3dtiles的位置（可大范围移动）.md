# 已知局部两点经纬度作平移：适合修正略微偏移的 3dTiles

这两点的实际距离不要太大，保守估计1km左右效果最佳，否则要考虑地表曲率进行复杂的旋转

``` JS
/**
 * @params {Cesium3DTileset} 待局部平移的3dtiles数据 
 * @params {Number[3]} 经纬度+高度，不平移高度可填 0，例如 [113.2, 23.5, 0]
 */
function move(tileset, to) {
  const tileset_center = tileset.boundingSphere.center
  const to_center = Cesium.Cartesian3.fromDegrees(...to)
  const translation = Cesium.Cartesian3.substract(to_center, tileset_center)
  tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation)
}
```

如果你想返回纠偏后的矩阵以便写入 `tileset.json`，最后返回一个新矩阵即可：

``` JS
return Cesium.Matrix4.multiply(tileset.modelMatrix, tileset.root.transform, new Cesium.Matrix4())
```

## *3dTiles 透明

为了方便比对，你可以通过 Cesium3DTileStyle 来设置全局透明度

``` JS
tileset.style = new Cesium.Cesium3DTileStyle({
  color: {
    evaluateColor: function (feature, result) {
      let color = new Cesium.Color(1, 1, 1, 0.6);
      return color;                            
    }
  }
});
```

# 大尺度平移+旋转

因为坐标的形状是椭球体，而不是正球体，所以地表任意两点的最短弧线并不是圆弧。

前提是知道模型中心对应的真实经纬度+高度。

## 目的地法

先获取 `tileset.root.transform`，求其逆矩阵，这样一相乘就能将模型置于球心。

随后，使用 `Transform.eastNorthUpToFixedFrame(模型中心点对应经纬度)`，获取转换矩阵，即能正确平移、旋转到目的地。

我称这种变换为目的地法：
$$
tileset.modelMatrix = M_{东北上转换矩阵}·M_{tileset.root.transform的逆矩阵}
$$

## 旋转轴法（不能用）

解算模型中心对应的真实经纬度+高度这两个点的世界坐标，以这两个坐标表示的向量，作叉乘，得出旋转轴。绕此旋转轴旋转这两个向量的夹角（使用余弦定理可以算得）旋转即可。

但是这仍然有一个问题：旋转轴法默认是球面旋转，旋转的轨迹是正圆弧，但是上面已经说了，这个方法不合适。

## 三轴旋转法（不推荐）

平移到世界坐标原点，然后分别三轴旋转，再平移到目的地。

算法简单，但是计算量巨大（要求旋转角度、5个矩阵相乘等）。