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



## 2.2. 计算协方差矩阵

### ① Vector3[] → x: float[], y: float[], z: float[]

### ② 构造协方差矩阵

$$
COV(x,y,z) =\left[ \begin{matrix}  
COV(x,x)&COV(x,y)&COV(x,z)\\
COV(x,y)&COV(y,y)&COV(y,z)\\
COV(x,z)&COV(y,z)&COV(z,z)
 \end{matrix}\right]
$$

其中，
$$
COV(a,b) = \displaystyle 
\frac{1}{n}
\sum^{n}_{i = 1}{(a_i-\overline{a})(b_i-\overline{b})}
$$
因为这里不是计算的样本，所以除以n即可。

## 2.3. 相似对角化

$COV(x,y,z)$ 一定是实对称矩阵，那么必定可以相似对角化。

由于是三个随机变量xyz，所以矩阵是三阶的。

求得三个特征值与三个对应的特征向量。

特征值即所有点投影到该向量上的长度和。



## 2.4. 投影计算得结果

将所有的点（`Vector3`）投影到三个向量上，分别取最大值、最小值，即可得到6个数字，构成三个带半长的轴向量。

最大最小值的均值，即中心点。

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