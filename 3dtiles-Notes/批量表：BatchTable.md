# 批量表：BatchTable

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

