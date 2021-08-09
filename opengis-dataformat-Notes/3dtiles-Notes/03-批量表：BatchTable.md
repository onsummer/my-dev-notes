## 批量表：BatchTable

批量表是瓦片数据文件中二进制数据体的一个组成部分，位于要素表之后。它包括了每个要素与特定应用有关的属性。

“建筑高度”、“几何坐标”、“数据库主键”等均是批量表的存储的数据的例子。

b3dm、i3dm、pnts都用到了批量表。

## 二进制结构布局

与要素表一致。

### 二进制数据填充

与要素表一致。

### JSON头

批量表JSON头的值有两种表达：

- 键值对，值是数组。例如

    ``` JSON
    "name": ['name1', 'name2', 'name4']
    ```

    或者

    ``` JSON
    "height": [10.0, 20.0, 15.0]
    ```

    - 值必须是json的数据类型，可以为空。
    - 每个数组的长度（元素个数）等于`batchLength`，这个`batchLength`就是每个瓦片中要素是数量。例如，在b3dm文件中，`batchLength`就是模型数量，在i3dm中就是点的个数。

- 对批量表二进制数据体的引用，由包括`byteOffset`、`componentType`、`type`三个属性的对象来表示，例如：

    ``` JSON
    "height": {
        "byteOffset": 24,
        "componentType": "FLOAT",
        "type": "SCALAR"
    }
    ```

    - `byteOffset`是相对于批量表二进制数据体起始字节的偏移量。`byteOffset`必须是`componentType`对应C语言数据类型占用字节数的倍数，例如，如果`componentType`是"FLOAT"，即4byte，那么`byteOffset`必须是4byte的倍数。
    - `componentType`是每个`batchId`值的数据类型。
    - `type`是每个`batchId`的组件结构，有四个值"SCALAR"、"VEC2"、"VEC3"、"VEC4"，即单值、2~4维向量。

    这个"height"就是所谓的`batchId`，用来区分每个数据。

> 代码实现注意：在js实现中，btJSON可以从ArrayBuffer获取，然后用TextDecoder转换成字符串，然后再用JSON.parse解析成js对象。

例如，下面有一个BatchTable，存储了两个要素的属性：

```JSON
{
    "id" : ["unique id", "another unique id"],
    "displayName" : ["Building name", "Another building name"],
    "yearBuilt" : [1999, 2015],
    "address" : [
        {"street" : "Main Street", "houseNumber" : "1"}, 
        {"street" : "Main Street", "houseNumber" : "2"}
    ]
}
```

那么，`batchId`=0的要素的属性为：

```js
id[0] = 'unique id';
displayName[0] = 'Building name';
yearBuilt[0] = 1999;
address[0] = {street : 'Main Street', houseNumber : '1'};
```

## 二进制体

当json头部某个属性是`BinaryBodyReference`时，它所提供的`byteOffset`即是对二进制数据体的引用。

![image-20200508195842873](attachments/image-20200508195842873.png)

例如上图，id即batchId，componentType代表这个batchId的数据类型（此处是INT），type为"SCALAR"表示这个batchId一条数据是一个“常量”，这个batchId的起始二进制索引是第16byte。

componentType的对应byte大小&type对应的byte大小

| `componentType`    | Size in bytes |
| ------------------ | ------------- |
| `"BYTE"`           | 1             |
| `"UNSIGNED_BYTE"`  | 1             |
| `"SHORT"`          | 2             |
| `"UNSIGNED_SHORT"` | 2             |
| `"INT"`            | 4             |
| `"UNSIGNED_INT"`   | 4             |
| `"FLOAT"`          | 4             |
| `"DOUBLE"`         | 8             |

| `type`     | Number of components |
| ---------- | -------------------- |
| `"SCALAR"` | 1                    |
| `"VEC2"`   | 2                    |
| `"VEC3"`   | 3                    |
| `"VEC4"`   | 4                    |

# 代码实现案例

给定下列btJSON（batchLength为10），BatchTable存储了"height"和"geographic"两个属性。

```json
// batchTable JSON
{
    "height" : {
        "byteOffset" : 0,
        "componentType" : "FLOAT",
        "type" : "SCALAR"
    },
    "geographic" : {
        "byteOffset" : 40,
        "componentType" : "DOUBLE",
        "type" : "VEC3"
    }
}
```

获取这10个height：

```js
const height = batchTableJSON.height;
const byteOffset = height.byteOffset;
const componentType = height.componentType;
const type = height.type;

let heightArrayByteLength = batchLength * sizeInBytes(componentType) * numberOfComponents(type); // 10 * 4 * 1
let heightArray = new Float32Array(batchTableBinary.buffer, byteOffset, heightArrayByteLength);
let heightOfFeature = heightArray[batchId];
```

获取这10个geographic：

```js
const geographic = batchTableJSON.geographic;
const byteOffset = geographic.byteOffset;
const componentType = geographic.componentType;
const type = geographic.type;
const componentSizeInBytes = sizeInBytes(componentType)
const numberOfComponents = numberOfComponents(type);

let geographicArrayByteLength = batchLength * componentSizeInBytes * numberOfComponents // 10 * 8 * 3
let geographicArray = new Float64Array(batchTableBinary.buffer, byteOffset, geographicArrayByteLength);
let geographicOfFeature = positionArray.subarray(batchId * numberOfComponents, batchId * numberOfComponents + numberOfComponents); 
```

