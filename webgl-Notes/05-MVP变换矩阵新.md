参考教程：闫令琪 - 现代计算机图形学入门 P4

# 1. 模型变换（Model Transform）

模型变换，是将所谓的建模坐标系（或者模型坐标系、局部坐标系）摆正到世界坐标系的变换过程。

这个通常伴随着基础的 **平移变换**、**线性变换（沿着坐标轴旋转 + 沿着坐标轴缩放）**

通常，是先线性变换，再平移变换。

$M_{model}$ 矩阵的写法
$$
M_{model} = T_{model}·R_{model}·S_{model}
$$
在这里，强调 T 一定要位于最左侧，R 和 S 可以任意交换顺序。

## 1.1. 转换局部坐标（建模坐标、模型坐标）到世界坐标

通过模型矩阵，变换局部坐标（建模坐标、模型坐标）一个点 $P = (x, y, z, 1)$ 或 变换一个向量 $\vec v = (x, y, z, 0)$ 到世界坐标系上，可以通过如下计算进行：
$$
P_{world} = M_{model} · P \\
v_{world} = M_{model} · \vec v
$$

# 2. 视图变换（View Transform）

## 2.1. 相机即视点（view）

相机，由三个量定义：

- 在世界坐标中的位置，记为 $\vec e$
- 从相机位置到观察目标的方向向量，记为 $\hat g$
- 相机上方向，记为 $\vec t$

相机又叫做观察点，即 `View` 的由来。

## 2.2. 作用

视图变换的作用是

- 把相机位置当作坐标原点（注意，变换前相机是在世界坐标下的）
- 把相机的观察方向 $\hat g$ 作为 $-Z$ 轴
- 把相机的上方向 $\vec t$ 作为 $Y$ 轴

所以，视图矩阵是这样的：
$$
M_{view} = R_{view}·T_{view}
$$


换个方向想，视图变换就是将世界坐标系对齐到相机坐标系上（或者相机+所有模型统一移动 + 线性变换到世界坐标原点上）。这样做有什么好处？对下一步的投影变换有好处，减少算量。

## 2.3. 如何变换

首先，将相机平移到原点很简单，是一个普通的平移矩阵 $T_{view}$
$$
T_{view} = \begin{bmatrix} 
1&0&0& -x_{\vec e} \\  
0&1&0&-y_{\vec e} \\  
0&0&1&-z_{\vec e} \\  
0&0&0&1 
\end{bmatrix}
$$
然后是对 $\hat g$ 和 $\vec t$ 进行变换。这个属于任意轴转到坐标轴，这个比较困难，但是大佬们早就身经百战，想到了一个绝妙的方法：反过来想。

普通的绕坐标轴旋转矩阵是非常简单的，这里即 $-Z$ 轴这个向量转到 $\hat g$，将 $Y$ 轴旋转到 $\vec t$，将 $X$ 轴旋转到 $\hat g ×\vec t$ 向量，这个过程其实就是 $R_{view}$ 的逆矩阵：
$$
R^{-1}_{view} = \begin{bmatrix} 
x_{\hat g × \vec t} & x_{\vec t} & x_{-\hat g }& 0 \\
y_{\hat g × \vec t} & y_{\vec t} & y_{-\hat g }& 0 \\
z_{\hat g × \vec t} & z_{\vec t} & z_{-\hat g }& 0 \\
0 & 0 & 0 & 1 \\
\end{bmatrix}
$$

## 2.4. $R^{-1}_{view}$ 这个矩阵是怎么来的

> 实际上，$R^{-1}_{view}$ 意义是世界坐标对齐（转换）到相机坐标的矩阵。
>
> 拿 $R^{-1}_{view}$ 乘以某个坐标轴，例如 $Y$ 轴，应该得到相机的上方向向量 $\vec t$
>
> 坐标轴旋转就非常容易了，矩阵第一列前三个数即为 $X$ 轴旋转的结果向量即可，同理第二列前3个数为 $Y$ 轴旋转的结果向量 …
>
> 用列分块，很容易理解：
> $$
> R^{-1}_{view} = \begin{bmatrix} -\hat g × \vec t & \vec t & -\hat g & \vec a \end{bmatrix}
> $$
> 分4列，那么这个一行四列的矩阵乘以一个列向量，例如乘以 $\vec x = (1,0,0,0)$ 结果是：
> $$
> \begin{align}
> R^{-1}_{view} · \vec x & = \begin{bmatrix} -\hat g × \vec t & \vec t & -\hat g & \vec a \end{bmatrix} · \vec x \\ &  = -\hat g × \vec t × 1 + 0 + 0 + 0 \\ &  =  -\hat g × \vec t
> \end{align}
> $$
> 即第一列为 $\vec x$ 的变换结果。
>
> 所以，$R^{-1}_{view}= \begin{bmatrix} -\hat g × \vec t & \vec t & -\hat g & \vec a \end{bmatrix}$ 这个矩阵代表了将世界坐标的 xyz 三个轴旋转到 $-\hat g × \vec t 、 \vec t、 -\hat g$ 这三个向量上。

旋转矩阵一定是正交矩阵，其逆矩阵即转置，那么容易求得 $R_{view}$ 的真身
$$
R_{view} = (R^{-1}_{view})^T = \begin{bmatrix} 
x_{\hat g × \vec t} & y_{\hat g × \vec t}  & z_{\hat g × \vec t}& 0 \\
x_{\vec t} & y_{\vec t} & z_{\vec t}& 0 \\
x_{-\hat g } & y_{-\hat g } & z_{-\hat g }& 0 \\
0 & 0 & 0 & 1 \\
\end{bmatrix}
$$
所以
$$
M_{view} = R_{view}·T_{view} = \begin{bmatrix} 
x_{\hat g × \vec t} & y_{\hat g × \vec t}  & z_{\hat g × \vec t}& 0 \\
x_{\vec t} & y_{\vec t} & z_{\vec t}& 0 \\
x_{-\hat g } & y_{-\hat g } & z_{-\hat g }& 0 \\
0 & 0 & 0 & 1 \\
\end{bmatrix}·\begin{bmatrix} 
1&0&0& -x_{\vec e} \\  
0&1&0&-y_{\vec e} \\  
0&0&1&-z_{\vec e} \\  
0&0&0&1 
\end{bmatrix}
$$
综上，视图矩阵的计算只需 9 个数字，即 **相机的世界坐标**、**相机的目标向量**、**相机的上方向向量**。

> 有的函数库会把计算视图矩阵描述为计算 `lookAt`。

## 2.5. 将世界坐标系的某个点转换到相机坐标下

$$
\begin{align}
P_{view} & = M_{view} ·P_{world} \\ 
& = M_{view}·M_{model}·P \\
& = M_{modelView} · P
\end{align}
$$

# 3. 投影变换（Projection Transform）

## 3.1. 可见区域

不管是正交投影，还是透视投影，都要先确定一个可见区域。为什么？因为确定可见区域本来就具备一定的实际意义，毕竟就算是人，在某个状态也只能看到眼前的一篇有限区域。相机也是一样的。

这个可视区域，正交投影中是一个长方体，透视投影是倒放的四棱台（也叫截头四棱锥、截头体，英文名 Frustum）。

正交投影的可见区域既然是一个长方体，那么确定一个长方体（注意，当前坐标已经是相机坐标系），需要什么参数呢？
$$
[x_{max}, \quad x_{min},\quad y_{max}, \quad y_{min},\quad z_{max}, \quad z_{min}] \\
$$
由三轴的最大最小值即可定义一个长方体，不妨设为
$$
[right, \quad left, \quad top, \quad bottom, \quad near, \quad far]\\
$$
简写为
$$
[r, \quad l, \quad t, \quad b,\quad n,\quad f]
$$
其中，n 和 f 如果是距离而不是坐标，那么应该写成：
$$
[r, \quad l, \quad t, \quad b,\quad -n,\quad -f]
$$


因为相机是朝着 $-Z$ 方向看的，所以 n 和 f 要取负。

## 3.2. 投影变换算出来是什么

先回答：投影坐标（Projection Coordinates），仍然是三维的。

正交投影的目的是，将长方体平移到相机坐标系中心，并将各个轴压缩至 $[-1, 1]^3$ 这个立方体空间内。

透视投影的目的是，将截头体先压成正交投影的长方体，再进行正交变换到 $[-1, 1]^3$ 这个立方体空间内。

而这两个立方体空间，都叫做投影坐标空间，执行投影变换就相当于把相机坐标系转换成了投影坐标系。

> 为啥是 $[-1, 1]^3$？应该是方便后续裁剪、规范化操作吧

## 3.2. 正交投影

上面提及，正交投影算得的投影坐标，实际上经过了两个过程：

- 平移至相机坐标系中心
- 可见区域长方体缩放到 $[-1,1]^3$ 这个立方体内

根据上文提及，正交投影的可视空间是一个长方体，由六个参数决定。

利用这六个参数，构造平移矩阵和缩放矩阵。先计算的写右边，挨个左乘，所以正交投影矩阵 $M_{ortho}$ 是：
$$
\begin{align}
M_{ortho} & = S_{ortho} · T_{ortho}\\ 
& = \begin{bmatrix} 
\displaystyle {\frac{2}{r-l}} & 0 & 0 & 0 \\
0 & \displaystyle {\frac{2}{t-b}} & 0 & 0 \\
0 & 0 & \displaystyle {\frac{2}{n-f}} & 0 \\
0 & 0 & 0 & 1 \\
\end{bmatrix} · \begin{bmatrix} 
1 & 0 & 0 & \displaystyle -{\frac{r+l}{2}}  \\
0 & 1 & 0 & \displaystyle -{\frac{t+b}{2}} \\
0 & 0 & 1 & \displaystyle -{\frac{n+f}{2}} \\
0 & 0 & 0 & 1 \\
\end{bmatrix} \\
& = \begin{bmatrix} 
\displaystyle {\frac{2}{r-l}} & 0 & 0 & \displaystyle -{\frac{r+l}{2}} \\
0 & \displaystyle {\frac{2}{t-b}} & 0 & \displaystyle -{\frac{t+b}{2}} \\
0 & 0 & \displaystyle {\frac{2}{n-f}} & \displaystyle -{\frac{n+f}{2}} \\
0 & 0 & 0 & 1 \\
\end{bmatrix}
\end{align}
$$

伪代码给到

``` JS
function setOrtho(l, r, t, b, n, f) {
  return new Matrix4(
    2/(r-l), 0, 0, -(r+l)/2,
    0, 2/(t-b), 0, -(t+b)/2,
    0, 0, 2/(n-f), -(n+f)/2,
    0, 0, 0, 1
  )
}
```

## 3.3. 透视投影

### step1. 形变成（而不是相似变换成）一个长方体

透视投影在正交投影之前做多了一步，将截头体形变成一个长方体。

根据资料显示，这不是简单的z方向相似变换，而是一种非线性变换。

形变过程中，有三点性质是不变的：

- 近裁剪面的 xyz 均不变
- 远裁剪面的 z 不变，xy变成近裁剪面的xy
- 远裁剪面的中心点始终不变

至于远近裁剪面之中的点，它们的 xyz，就不好说了。

推演过程：

存在形变矩阵 $M_{reshape}$，使得对于截头体内任意齐次坐标表示的一个点 $P_{view}=(x,y,z,1)$，在经过此矩阵变换后均落在以近裁剪面为底，$f - n$ 为深度的长方体内，不妨设变换后的点的齐次坐标为 $P'=(x', y',z',1)$

易得
$$
P' = M_{reshape}·P_{view}
$$
从摄像机出发，引出一条射线，与远近裁剪面的交点分别为 $P_1=(x_1, y_1,z_1,1)、P_2=(x_2,y_2,z_2,1)$

在经过 $M_{reshape}$ 变换后，根据相似三角形理论，$P_2$ 的 xy 值应该有如下关系
$$
x_1 = \frac{n}{f}x_2, \quad y_1 = \frac{n}{f}y_2 \\
M_{reshape}·P_2
=M_{reshape}·\begin{pmatrix} x_2 \\ y_2 \\ z_2 \\ 1 \end{pmatrix}
=\begin{pmatrix} x_1 \\ y_1 \\ ? \\ 1 \end{pmatrix} 
=\begin{pmatrix} \displaystyle \frac{n}{f}x_2 \\ \displaystyle \frac{n}{f}y_2 \\ ? \\ 1 \end{pmatrix}
$$
此时，由齐次坐标的概念，$\begin{pmatrix} \displaystyle \frac{n}{f}x_2 & \displaystyle \frac{n}{f}y_2 & ? & 1 \end{pmatrix}^T$ 实际上等价于 $\begin{pmatrix} nx_2 & ny_2 & ? & n \end{pmatrix}^T$

即全部乘以 n，则等式变成
$$
M_{reshape}·P_2=M_{reshape}· \begin{pmatrix} x_2 \\ y_2 \\ z_2 \\ 1 \end{pmatrix}
= \begin{pmatrix} nx_2 \\ ny_2 \\ ? \\ n \end{pmatrix}
$$
观察得知 $M_{reshape}$ 部分元素如下：
$$
M_{reshape} = \begin{bmatrix} n & 0 & 0 & 0 \\
0 & n & 0 & 0\\
? & ?& ?&? \\
0 & 0 & 1 & 0
\end{bmatrix}
$$
即满足
$$
P' =\begin{bmatrix} n & 0 & 0 & 0 \\
0 & n & 0 & 0\\
? & ?& ?&? \\
0 & 0 & 1 & 0
\end{bmatrix}·P_{view}
$$


令第三行向量为 $α=(a_1,a_2,a_3,a_4)$，根据性质 “近裁剪面的 xyz 均不变”，不妨取近裁剪面的中心点 $P_3=(x_3, y_3,n,1)$ 代入，得
$$
\begin{align}
M_{reshape}·P_3= 
\begin{bmatrix} n & 0 & 0 & 0 \\
0 & n & 0 & 0\\
a_1 & a_2 & a_3 & a_4 \\
0 & 0 & 1 & 0
\end{bmatrix} · \begin{pmatrix} x_3 \\ y_3 \\ n \\ 1 \end{pmatrix}=
\begin{pmatrix} nx_3 \\ ny_3 \\ n^2 \\ n \end{pmatrix} \\
即 \quad a_1x_3 + a_2y_3 + a_3n + a_4=n^2 \\
∵ 等式右侧无x_3、y_3 \\
此处不难得到\quad a_1 = 0,\quad a_2 =0\\
即 \quad a_3n + a_4=n^2
\end{align}
$$
根据性质 "远裁剪面的中心坐标不变"，设其为 $P_4=(0,0,f,1)$ 代入，的
$$
\begin{align}
M_{reshape}·P_4
=\begin{bmatrix} 
n & 0 & 0 & 0 \\
0 & n & 0 & 0\\
0 & 0 & a_3 & a_4 \\
0 & 0 & 1 & 0
\end{bmatrix} · 
\begin{pmatrix} 0 \\ 0 \\ f \\ 1 \end{pmatrix}=f^2 \\
即\quad a_3f + a_4 = f^2
\end{align}
$$
联立方程组
$$
\begin{cases}
a_3·n + a_4 = n^2\\
a_3·f + a_4 = f^2
\end{cases}
\quad二元一次方程组解得
\begin{cases}
a_3 = n + f \\
a_4 = -nf
\end{cases}
$$
所以矩阵 $M_{reshape}$ 为
$$
M_{reshape}
=\begin{bmatrix} 
n & 0 & 0 & 0 \\
0 & n & 0 & 0\\
0 & 0 & n+f & -nf \\
0 & 0 & 1 & 0
\end{bmatrix}
$$
即截头体内任何一点 $P_{view}$ 变换到正交可视长方体内对应点的计算为
$$
\begin{align}
P' &= M_{reshape} · P_{view} \\
&=\begin{bmatrix} 
n & 0 & 0 & 0 \\
0 & n & 0 & 0 \\
0 & 0 & n+f & -nf \\
0 & 0 & 1 & 0
\end{bmatrix}·\begin{pmatrix} x \\ y \\ z \\ 1 \end{pmatrix}
\end{align}
$$


### step2. 继续做一次正交投影

最终，经过正交投影后，即得到透视投影矩阵
$$
\begin{align}
M_{persp}&=M_{ortho}·M_{reshape} \\
& = \begin{bmatrix}
\displaystyle {\frac{2}{r-l}} & 0 & 0 & \displaystyle -{\frac{r+l}{2}} \\
0 & \displaystyle {\frac{2}{t-b}} & 0 & \displaystyle -{\frac{t+b}{2}} \\
0 & 0 & \displaystyle {\frac{2}{n-f}} & \displaystyle -{\frac{n+f}{2}} \\
0 & 0 & 0 & 1 \\
\end{bmatrix}·\begin{bmatrix} 
n & 0 & 0 & 0 \\
0 & n & 0 & 0 \\
0 & 0 & n+f & -nf \\
0 & 0 & 1 & 0
\end{bmatrix} 
\end{align}
$$

# 4. 透视投影的 fov-aspect 表达法



# 5. 透视投影的 frustum 表达法