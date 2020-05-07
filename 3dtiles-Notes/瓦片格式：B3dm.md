# 概述



## 二进制文件结构布局

略

### 填充

略

## 文件头：B3dm.Header

略

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

# glb

b3dm嵌入了gltf 2.0标准的glb模型。

glb模型紧随在BatchTable之后，它包括模型的几何、纹理、动画以及引用的外部资源。

每个顶点（vertex）都有一个`batchId`来指明这个顶点属于哪个模型。例如，下例是一个有3个模型的顶点、法线列表（batchId有0、1、2三个值）

```
batchId:  [0,   0,   0,   ..., 1,   1,   1,   ..., 2,   2,   2,   ...]
position: [xyz, xyz, xyz, ..., xyz, xyz, xyz, ..., xyz, xyz, xyz, ...]
normal:   [xyz, xyz, xyz, ..., xyz, xyz, xyz, ..., xyz, xyz, xyz, ...]
```

batchId不一定要按顺序排列，所以下面的排列也是OK的：

``` 
batchId:  [0,   1,   2,   ..., 2,   1,   0,   ..., 1,   2,   0,   ...]
position: [xyz, xyz, xyz, ..., xyz, xyz, xyz, ..., xyz, xyz, xyz, ...]
normal:   [xyz, xyz, xyz, ..., xyz, xyz, xyz, ..., xyz, xyz, xyz, ...]
```

注意，顶点不能被多个模型共享，每个顶点只能属于一个模型（即batch），如果有位置上重复的顶点，那么就多复制一份以便让batchId匹配。

和普通的gltf模型不太一样，如果是b3dm所用的gltf模型，那么假设全局FeatureTableJSON属性`BATCH_LENGTH`不为0（只要这个瓦片不为空瓦片，就不会是0），gltf中mesh->primitive->attribute中就必定会存在一个`_BATCHID`的属性，它的值指向的是`accessor`访问器。

例如：

``` JSON
"primitives": [
    {
        "attributes": {
            "_BATCHID": 0
        }
    }
]
```

``` JSON
{
    "accessors": [
        {
            "bufferView": 1,
            "byteOffset": 0,
            "componentType": 5126,
            "count": 4860,
            "max": [2],
            "min": [0],
            "type": "SCALAR"
        }
    ]
}
```

`accessor`的`type`必须是"SCALAR"，也就是常量。accessor其他属性均应符合gltf标准，没有额外的要求。



> 译者注：
>
> gltf中名为"_BATCHID"的accessor，其数据个数一定与顶点数量一致。因为每个顶点都有一个`batchId`属性。
>
> 而`batchId`有多少个？资料上来看，BATCH_LENGTH位于FeatureTable.JSON中，一般不会是0，它的含义是当前瓦片中模型的数量。
>
> 目前仍未知道gltf中_BATCHID这个访问器的数据长什么样。