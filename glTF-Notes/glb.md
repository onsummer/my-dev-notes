GLB 文件格式规范

glTF有两种存数据的方式：二进制数据文件的引用、二进制的base64编码dataURI。

如果使用Base64编码，程序就要专门处理uri属性才能解码，并增加了glTF文件大小（对于base64编码的情况，glTF大小增加约33％）。

尽管可以使用gzip压缩文件体积，但解压缩和解码仍然会增加的时间成本。

为了解决这个问题，引入了一种容器格式Binary glTF——扩展名为glb。在Binary glTF中，可以将glTF资源（JSON，.bin和图像）存储在二进制blob中。

此二进制Blob具有以下结构：

- 有一个12byte的文件头

- 一个或多个数据块，每个数据块包含glTFJSON和二进制数据。

例如，想要按需下载纹理的应用程序可以将除图像以外的所有内容嵌入Binary glTF中。glb中仍旧可以在uri里写入base64编码的dataURI，但是不推荐，毕竟base64还要解码。

# 文件格式

*.glb

# MIME Type

`model/gltf-binary`

# 文件结构布局

glb使用小端编码。下图是glb的结构

![img](E:\PrivateDocs\个人成果\005 3dtiles\glTF\attachments\glb2.png)

## 文件头

文件头占12byte，分为3个uint32（各4byte）数据，分别是

- magic
- version
- length

magic的值是uint32（4byte），是16进制的`0x46546C67`，是ASCII编码，即`glTF`字符串。用来标识此文件是glTF文件。

version指明glTF的版本，现在是2。

length是glb整个文件的size，包括文件头和后面的数据块。

## 数据块

glb在文件头后，有两个数据块，即`Chunk 0`代表glTF的JSON文本，`Chunk 1`代表glTF引用的二进制数据文件。

每个块都有三个信息：

- chunkLength（uint32类型，占4byte）
- chunkType（uint32类型，占4byte）
- chunkData（ubyte[]类型）

    chunkLength代表的是chunkData的长度。chunkType指示当前数据块是什么数据，chunkData是当前数据块的真正数据。

chunkType的值只能是以下两种：

|      | chunkType可选值 | ASCII编码 | 描述                   | Occurrences |
| ---- | --------------- | --------- | ---------------------- | ----------- |
| 1    | `0x4E4F534A`    | `JSON`    | 代表数据块是JSON       | 1           |
| 2    | `0x004E4942`    | `BIN`     | 代表数据块是二进制文件 | 1或0        |

> gltf所引用的binary数据，字符编码排序方式是小端排序，也即从右往左。
>
> 以glb的magic为例：
> 0x46546C67 此16进制数字从左往右（大端排序）是 "FTlg"，小端排序是 "glTF"

程序在读取glb时，必须忽略其他未知类型的数据块，以便glTF具备扩展性，在官方的两个数据块后再补充其他数据块。

### JSON数据块

该块保存结构化的glTF JSON，和gltf文件一样。

> 程序编写时注意：在JavaScript实现中，将第0个数据块读取为ArrayBuffer，然后用TextDecoder翻译成字符串，然后用JSON.parse解析成js对象即可。

JSON数据块必须是glb的第一个块。先读取此块，才能逐步从后续块中检索资源。

在第一个块的数据部分，如果不满足byte对齐要求，则用空格字符（0x20）填充。

### 二进制数据块

该块包是几何图形，动画关键帧，皮肤和纹理图像的数据。

这个块必须是glb的第二个数据块。

如果不满足byte对齐，必须用零值（0x00）填充此块。

​	

# 特别注意

## ① buffers只能有一个

gltf所有资源都要合并成一个二进制资源文件，包括图片数据

## ② buffers[0].uri不能存在

在转换二进制之前，必须删除uri属性。