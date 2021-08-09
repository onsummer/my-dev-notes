# 要素表：FeatureTable

要素表是3dtiles中，某个瓦片数据文件（例如b3dm）二进制数据体部分的一个组件。它记录了这个瓦片中，每个要素有关的位置、外观属性信息。

*批量表（BatchTable），则用来记录这个要素与渲染无关的属性信息。* 

只有b3dm瓦片、pnts瓦片才使用要素表。b3dm中每个模型是一个要素，pnts中每个点是一个要素。

每个瓦片的格式规范中定义了每种瓦片的Semantic，这个Semantic规定了每个要素有哪些具体的属性。

## 二进制结构布局

要素表包括两部分：JSON头和可选的二进制数据体（小端编码）。

JSON头的键名在每种瓦片的Semantic中有定义，而对应的值既可以直接写出来，也可以是对二进制数据体的引用（例如引用字节偏移量，以便程序读取）。

连续超长数组存二进制数据体中效率更好。

要素表在整个瓦片文件中，位于瓦片的数据头之后。瓦片的数据头中的`featureTableJSONByteLength `和`featureTableBinaryByteLength`这两个C语言类型位uint32的字段记录了要素表的JSON头和数据体的长度。

### 二进制结构填充

JSON头的二进制体积必须是8byte的倍数。如果不够，必须用空格补齐8byte的倍数。空格的十六进制编码是`0x20`，二进制编码是`0b00100000`。

二进制数据体同样要用8byte对齐。

二进制数据体的某种属性必须从一个“字节偏移量”开始，这个字节偏移量是这个属性的componentType对应的字节量。例如，某个属性的componentType是FLOAT类型，即该属性的每个元素占4byte，那么这个属性起始偏移量就必须是4byte的倍数。为了满足要求，就必须在真正的属性值二进制数据前填充一些其他的数据。

### JSON头

在JSON头中，要素表的值可以用三种方式表达：

- 一个简单键值对。例如，

    ``` JSON
    "INSTANCES_LENGTH": 4
    ```

    这个用于表达**全局属性**"INSTANCES_LENGTH"，这个属性定义了i3dm的模型实例数量。

- 一个简单的键值对，与第一种有区别的是其值是数组。

    ``` JSON
    "POSITION": [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]
    ```

    这个用于表达i3dm瓦片中每个要素的"POSITION"属性。每个要素的`POSITION`有三个float32类型的值，即对于此例，POSTITION有9个数字，等于有3个要素：要素1的坐标=(1.0, 0.0, 0.0)，要素2的坐标=(0.0, 1.0, 0.0)，要素3的坐标=(0.0, 0.0, 1.0)。

- 对二进制数据体的引用，由具有`byteOffset`属性的JSON对象表示。

    ``` JSON
    "SCALE": {
        "byteOffset": 24
    }
    ```

    - byteOffset的值是相对于二进制数据体的偏移量。byteOffset的值必须是对应属性的componentType的字节大小的倍数。例如，"POSITION"属性的componentType是FLOAT，即4byte，所以byteOffset必须是4byte的倍数。

    - Semantic定义了各个属性的数据结构类型，例如，i3dm中的"POSITION"属性的值若是对二进制数据体的引用，那么，这个属性的componentType就是FLOAT，而且这个属性的组件数量是3.

    - 一些Semantic允许不用默认的componentType。这个情况在不同的瓦片数据文件中是不同的，例如：

        ``` JSON
        "BATCH_ID" : {
            "byteOffset": 24,
            "componentType": "UNSIGNED_BYTE"
        }
        ```

        JSON头中有效的属性是各个瓦片格式定义的semantics以及可选的"extras"、"extensions"属性，如果自己定义其他JSON属性是无效的。

### 二进制数据体

如果JSON头是第三种形式，那么其`byteOffset`属性则用来索引二进制数据体。可根据要素数量、要素长度、要素id、要素数据类型来检索对应的值。

## 读取案例

下面这个例子用JavaScript来访问位置属性。

``` JS
var byteOffset = featureTableJSON.POSITION.byteOffset;
var positionArray = new Float32Array(featureTableBinary.buffer, byteOffset, featuresLength * 3);
var position = positionArray.subarray(featureId * 3, featureId * 3 + 3);
```

## 属性参考

### 要素表

略

### 二进制数据体参考

略

## 【译者补充】不同瓦片JSON头的官方定义属性

### b3dm

https://github.com/CesiumGS/3d-tiles/blob/master/specification/schema/b3dm.featureTable.schema.json

b3dm的要素表头，必须包括`BATCH_LENGTH`属性，可选`RTC_CENTER`、`extensions`、`extras`属性。

所有的b3dm要素表属性见此：https://github.com/CesiumGS/3d-tiles/blob/master/specification/TileFormats/Batched3DModel/README.md#semantics

`BATCH_LENGTH`属性是b3dm中模型的数量，模型又叫要素。如果glb没有`batchId`这个属性，那么这个属性的值是0。

