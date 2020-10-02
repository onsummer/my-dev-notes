# attributeStorageInfo 类

- 是否 `3dSceneLayer.json` 顶级元素：是

## 类描述

此类用于描述属性数据（attribute）的物理目录、文件存储结构、字节编码顺序等信息。

## 举例说明

``` JSON
"attributeStorageInfo": [
    {
        "key": "f_0",
        "name": "NAME",
        "header": [
            {
                "property": "count",
                "valueType": "UInt32"
            },
            {
                "property": "attributeValuesByteCount",
                "valueType": "UInt32"
            }
        ],
        "ordering": [
            "attributeByteCounts",
            "attributeValues"
        ],
        "attributeByteCounts": {
            "valueType": "UInt32",
            "valuesPerElement": 1
        },
        "attributeValues": {
            "valueType": "String",
            "encoding": "UTF-8",
            "valuesPerElement": 1
        }
    }
]
```

这里只有一个 `f_0` 属性，属性名叫 `NAME`

它的物理存储文件夹是 `f_0`，其内二进制文件头有两个属性：属性个数的 count 和 属性值的总字节长 attributeValuesByteCount，这两个属性的值类型都是 UInt32。

紧跟着的数据体有俩，它们的顺序记录在 `ordering` 中，他们的具体信息在下方写出。

## ① [属性] key（必选）

即在 `node/i/attributes/` 下的文件夹名，例如 `f_<i>`。

这个用于标识属性的唯一id

## ② [属性] name（必选）

属性的名称

## ③ [属性数组] header（必选）

`attributes\f_<i>\0.bin.gz` 内二进制文件的文件头记录的属性。

参考 [headerValue 类]()

## ④ [属性数组] ordering

文件头的各个属性的顺序。

## ⑤ [属性] attributeByteCounts

当此 `f_<i>` 文件记录的属性的值类型是 字符串 时，这个属性才需要存在。

这个属性记录的是每个字符串属性值的字节长度值的元数据，例如第一个字符串是 `"球场A\0"`，它的字节长是 x byte，那么这个x对应的数据类型可以是 `UInt32`。

参考 [value 类]()

## ⑥ [属性] attributeValues

这个属性记录的是每一个属性值的元数据，例如 编码类型（一般是UTF-8）、值类型（String）等。

参考 [value 类]()

## ⑦ [属性] objectIds

记录此属性在当前 I3S Node 的 OID，貌似没见过。

参考 [value 类]()