[Graphics Tech in Cesium - Vertex Compression | cesium.com](https://cesium.com/blog/2015/05/18/vertex-compression/)

# 顶点压缩概述

计算机图形学中一种常见的作法是打包、压缩顶点属性。它增加了顶点着色器中的代码，达到减小内存占用的效果，同时也减少了数据通过总线从CPU到GPU的时间，降低了GPU内存带宽。

另一个好处是，可以存放超过顶点属性的最大数量的其他额外顶点属性。

减少顶点属性的一种方法是将所有的属性成四维向量，并确保所有的分量充分得到使用。例如，代替如下顶点属性：

``` GLSL
attribute vec3 axis;
attribute float rotation;
```

可以用四维向量来代替：

``` GLSL
attribute vec4 axisAndRotation;

// 使用它
vec3 axis = axisAndRotation.xyz;
float rotation = axisAndRotation.w;
```

通过将多个顶点属性打包到单个浮点数中，可以进一步操作。举个例子，为什么在一个无符号的 byte 中存储一个 bool 类型的顶点属性？显然，bool 类型的只需要 1bit（1byte能存8bit）。作者希望 WebGL 2.0 中会有 GLSL 逐位运算符，不过在此之前，可以用乘除2的次方的方法来移位操作。

一个 32 位浮点数有 24 位精度，所以，可以将 24 位打包成一个浮点数。以 Cesium 中的 Billboard 的属性打包来举例，首先：

``` JS
var UPPER_BOUND = 32768.0;  // 2^15

var LEFT_SHIFT7 = 128.0;
var LEFT_SHIFT5 = 32.0;
var LEFT_SHIFT3 = 8.0;
var LEFT_SHIFT2 = 4.0;

// value 小于min返回min，大于max返回max，否则返回value
function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}
    
// pixelOffset 是屏幕空间的像素偏移量。假设它很短。
// 开始，将它限制在 ±2^15 范围内。
var compressed = CesiumMath.clamp(pixelOffsetX, -UPPER_BOUND, UPPER_BOUND);

// 然后加上 UPPER_BOUND，让它回到范围 [0, 2^16] 内
compressed = Math.floor(compressed + UPPER_BOUND);

// 左移，以便可以使用剩余的位
// [译者注] js 的左移貌似不是这样的，而且左移 128 位应该是不对的，应该是左移 7 位（2^7=128）？
// [译者注] 经查应该是 compressd << 7;
compressed = * LEFT_SHIFT7;

// 水平的对齐方式（horizontalOrigin）可以是 中央、左边、右边，那么用2bit就可以表示。
// 整数范围取值就是 [-1, 1]，加一个1到 [0, 2]，然后左移5位

// [译者注] horizontalOrigin 应该是一个表达 billboard 对齐点位的方式，一共三种，用 -1、0、1可以表示，加1就是 0、1、2，用二进制的
// 00、01、10 完全可以表示，只占 2bit，所以在上面移动了7位之后的7个bit中占2bit即可，即向左移动5bit
// [译者注] 假设 horizontalOrigin 是 2，那么二进制就是 0000 0010，因为前面左移空出7个bit，所以把顶头这个1移动5个bit即可：
// 0000 0010 -> 0100 0000
// [译者注] 所以这里这个乘号我也不知道他是不是写错代码了
compressed += (horizontalOrigin + 1.0) * LEFT_SHIFT5;

// 垂直方向的同理
compressed += (verticalOrigin + 1.0) * LEFT_SHIFT3;

// 是否显示是一个 bool 值，只用1bit就够了，刚好用完剩下的1bit
compressed += (show ? 1.0 : 0.0) * LEFT_SHIFT2;
```

只需要在 GLSL 中反过来操作就可以获取值，见 `BillboardCollectionVS.glsl` 中的顶点着色器。

有关更多的顶点压缩信息，见参考。

> 译者注
>
> 这很坑啊，js代码里的位运算貌似写错了。不过大体意思我是读懂了，根据特定场合优化数据的存储，从二进制入手。
>
> 只需要进行位运算，空出一些 bit，将一些本身并不需要很长存储位的变量塞进去就行了，在 glsl 中进行反操作，就可以获取压缩的值。

# 法线压缩

官方使用八进制表示法来表示 Cesium 中的单位向量。此表示方法将一个三维单位向量压缩为二维向量，这个二维向量的每个分量用 8 bit 存储。

参考 `AttributeCompression.octEncode` 方法来学习如何将单位三维向量转换成一个八进制编码的二维向量。

十进制编码的向量可以存储为二维无符号byte 类型的顶点属性。如果有更多可用的数据，或许可以更进一步打包向量。

还可以打包两个8bit 分量进一个浮点数，为其他数据留出 8bit。参考 `AttributeCompression.octEncodeFloat` 这个方法来学习编码过程，参考 `czm_octDecode` 这个 glsl 函数来解码。

还可以将三个单位向量打包成两个浮点数，参考 `AttributeCompression.octPack` 方法来学习如何编码，参考 `czm_octDecode` 这个 glsl 函数来解码。



将三个单位向量编码为两个浮点数仅对不相关的单位向量有用，例如，切线向量仅需要编码两个向量，可以使用其他两个的叉积作为第三个向量。

> 译者注
>
> 主要是各种缩缩缩，抠1bit是1bit，知道是单位向量的前提下可以尽可能减少bit的占用，而且知道关系的话，可以用数学计算完成表达的，就减少一个数据的存储也是不错的，例如这里提到的叉积。

# 纹理坐标压缩

对于 Cesium 的 Billboard 生成的几何，它的纹理坐标并不需要用完浮点数的全24位精度，只需要12位精度即可。

纹理重复并不需要，每个纹理坐标严格地限制在 0 到1之间。参考 `AttributeCompression.compressTextureCoordinates` 方法，它将纹理坐标压缩成一个浮点数。

在 Cesium 中，这么压缩可能会导致 billboard 失真，但是截至发文时，官方还没看到失真的效果。

# Cesium 中的顶点压缩

`Primitive` 类有一个 `compressVertices` 属性，默认值是 true，这意味着 切线空间向量、纹理坐标将会被压缩。

`BillboardCollection` 和 `LabelCollection` 的每个顶点具有18个属性，每个属性又是不同的类型和维度。压缩和打包后，每个顶点的属性被压缩成 8 个四维浮点向量。

参考 `BillboardCollection` 和它的顶点着色器（BillboardCollectionVS.glsl）。



> 译者小结
>
> 通过预判各种属性的情况，充分利用位运算和逻辑关系，可以将数据安插在有限的二进制位中，压缩的工作交给数据生产者和JavaScript。
>
> 随后由顶点着色器完成逆向解析数据的过程，充分利用GPU的计算能力。

# 参考

[Calver02] Dean Calver. Vertex Decompression in a Shader. In Direct3D ShaderX: Vertex and Pixel Shader Tips and Tricks. Edited by Wolfgang F. Engel. 2002.

[Cigolle14] Cigolle, Donow, Evangelakos, Mara, McGuire, Meyer, [A Survey of Efficient Representations for Independent Unit Vectors](http://jcgt.org/published/0003/02/01/), Journal of Computer Graphics Techniques (JCGT), vol. 3, no. 2, 1-30, 2014.

[Persson12] Emil Persson. [Creating Vast Game Worlds](http://www.humus.name/Articles/Persson_CreatingVastGameWorlds.pdf). 2012.

[Pranckevičius09] Aras Pranckevičius. [Compact Normal Storage for Small G-Buffers](http://aras-p.info/texts/CompactNormalStorage.html). 2009.