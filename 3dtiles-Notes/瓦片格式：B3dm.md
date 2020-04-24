# 概述



## 二进制文件结构布局

略

### 填充

略

## 文件头：B3dm.Header



## 要素表：B3dm.FeatureTable

这里简要描述Semantic。

Semantic：可以理解为要素表头JSON的规定属性。

- 要素Semantic

    无。

- 全局Semantic

    有两个，uint32类型的BATCH_LENGTH和float32[3]类型的RTC_CENTER。

    | Semantic名称 | 数据类型        | 描述                                                         | 是否必须 |
    | ------------ | --------------- | ------------------------------------------------------------ | -------- |
    | BATCH_LENGTH | uint32（4byte） | b3dm中要素数量，也即模型数量。如果glb没有batchId，那么这个属性的值是0. | 是       |
    | RTC_CENTER   | float32[3]      | 当瓦片的位置相对于中心而定义坐标时，由这个三维数组提供中心位置坐标。 | 否       |

    

## 批量表：B3dm.BatchTable

批量表中每个batchId的数组元素数量=模型数量（？）

