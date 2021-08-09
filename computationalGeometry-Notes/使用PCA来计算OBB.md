准备材料：

- `Vector3[]`

输出结果：

- 12个数字，前9个是三个向量（表示三轴的朝向与半长），最后3个是中心坐标。

# 1. 计算步骤

- ① 将点集中心设为原点

- ② 以x、y、z分量为随机变量，计算协方差矩阵

- ③ 对协方差矩阵进行相似对角化，取前三个特征向量为三个轴

- ④ 原始数据投影到这三个向量上，确定三个方向的最值，构造三个轴向量，从而确定中心点

# 2. 细节剖析

## 2.1. 去中心化

将点数据的中心坐标设为原点即可（平移操作）。

求中心坐标用平均数法。

## 2.2. 计算协方差矩阵

### ① Vector3[] → x: float[], y: float[], z: float[]

即将每个点的分量分到三个数组中，表示每个维度的分量集合

### ② 构造协方差矩阵

$$
COV(x,y,z) = \begin{bmatrix}  
COV(x,x)&COV(x,y)&COV(x,z)\\[1ex]
COV(x,y)&COV(y,y)&COV(y,z)\\[1ex]
COV(x,z)&COV(y,z)&COV(z,z)\\[1ex]
 \end{bmatrix}
$$

其中，
$$
COV(a,b) = \displaystyle 
\frac{1}{n}
\sum^{n}_{i = 1}{(a_i-\overline{a})(b_i-\overline{b})}
$$
因为这里不是计算的样本，所以除以n即可。

计算协方差的js代码举例：

``` JS
function cov(aArr, bArr) {
  const length = aArr.length
  let sum = 0
  if (bArr.length != length)
    return
  /* 算术平均数 */
  const avrA = aArr.reduce((acc, val) => acc + val, 0) / length
  const avrB = bArr.reduce((acc, val) => acc + val, 0) / length
  
  for (let i = 0; i < length; i++) {
    sum += (aArr[i] - avrA) * (bArr[i] - avrB)
  }
  return sum / (length - 1)
}
```



## 2.3. 相似对角化

$COV(x,y,z)$ 一定是实对称矩阵，那么必定可以相似对角化。

由于是三个随机变量xyz，所以矩阵是三阶的。

求得三个特征值与三个对应的特征向量。

特征值即所有点投影到该向量上的长度和。



## 2.4. 投影计算得结果

将所有的点（`Vector3`）投影到三个向量上，分别取最大值、最小值，即可得到6个数字：轴1max、轴1min、轴2max、轴2min、轴3max、轴3min，从而得到三个方向的长度。这个长度除以2，即obb的半长，从而构造一个长方体。

JS 代码参考如下

``` JS
const projectLengthCollection0 = []
const projectLengthCollection1 = []
const projectLengthCollection2 = []

/**
 * 计算 obb 的三个半长
 * @params {Number[][]} 点数组
 * @params {Number[3][3]} 特征向量数组
 */
function calObbLength(pointsArr, vecArr) {
  for (let j = 0; j < pointsArr.length; j++) {
    const vec0 = vecArr[0]; // 取特征向量i
    const vec1 = vecArr[1]; // 取特征向量i
    const vec2 = vecArr[2]; // 取特征向量i
    const pt = pointsArr[j];
    // 求投影长度 a在b的投影长度为 a·b / b 长度，即 vec·pt / |vec|
    const projLength0 = getProjectLength(pt, vec0);
    const projLength1 = getProjectLength(pt, vec1);
    const projLength2 = getProjectLength(pt, vec2);
    // 推入数组求最大最小值
    projectLengthCollection0.push(projLength0)
    projectLengthCollection1.push(projLength1)
    projectLengthCollection2.push(projLength2)
  }
  // 然后求三个数组的 max min 即可
}

/**
 * 计算投影长度
 * @params {Number[]} 点
 * @params {Number[3]} 特征向量
 */
function getProjectLength9(pt, vec) {
  let sum = pt[0] * vec[0] + pt[1] * vec[1] + pt[2] * vec[2]
  let vecLength = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2])
  return sum / vecLength
}
```



# 3. 参考资料

① [线性代数常见题型](https://jingyan.baidu.com/article/9989c746d5af17f648ecfefd.html)

② [Math.NET.Numerics](https://numerics.mathdotnet.com/DescriptiveStatistics.html)

③ [什么是协方差矩阵](https://zhuanlan.zhihu.com/p/37609917)

④ [分离轴定律判断OBB碰撞](https://blog.csdn.net/qq_36812406/article/details/82881827)

⑤ [PCA算点云的OBB](https://blog.csdn.net/YunLaowang/article/details/95061135)

⑥ [*PCA推导过程](https://www.cnblogs.com/pinard/p/6239403.html)

⑦ [*PCA创建OBB(国外)](https://hewjunwei.wordpress.com/2013/01/26/obb-generation-via-principal-component-analysis/)

⑧ [PCA创建OBB(翻译)](https://blog.csdn.net/qing101hua/article/details/53100112)

⑨ [PCA原理详解](https://zhuanlan.zhihu.com/p/37777074)

# 4. 参考库

## ① 统计量（平均数、协方差）计算

一般的语言和运行时都会有这种库

## ② 协方差矩阵（实对称，求特征值和特征向量）

稠密矩阵的特征值计算，Intel 用  MKL，或者 blas库、eigen库（C++）





此处 $COV(x,y,z)$ 是三维矩阵，那么特征值有3个，特征向量也有3个

将特征值从高到低排序，然后每个特征值对应一个特征向量。

第k个特征向量与原先数据内积就是对应的第k个主成分（投影计算？）

# 参考思路

1. 首先进行规范化（为了后续简单我没有对数据规范化）
2. 求出数据的协方差矩阵：`covariance = cov(data)`
3. 对协方差矩阵求特征值：`eigVector = eigs(covariance)`
4. 将数据乘以特征值进行映射`dataMapped = data*eigVector`。
5. 找到映射后坐标（包括主成分和第二主成分方向）的最大值`max`最小值`min`。
6. 包围盒的长宽分别为相应方向上的极差`max-min`。
7. 包围盒的中心坐标为最大最小值的平均值`centerMapped = (max+min)/2`反向映射后的坐标`center = center/eigVector`。
8. 将包围盒的半轴乘以方向的正余弦作为包围盒边界点距离中心点的偏移量`offset = extends*[cosθ sinθ]`

[基于PCA的有向包围盒（Oriented Bounding Box）生成及图像倾斜校正_顧辰的博客-CSDN博客](https://blog.csdn.net/weixin_43290523/article/details/105852921)