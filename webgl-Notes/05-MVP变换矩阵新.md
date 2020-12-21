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
> 所以，$R^{-1}_{view}= \begin{bmatrix} -\hat g × \vec t & \vec t & -\hat g & \vec a \end{bmatrix}$ 这个矩阵代表了将世界坐标三个轴旋转到 $-\hat g × \vec t 、 \vec t、 -\hat g$ 这三个向量上。

旋转矩阵一定是正交矩阵，那么容易求得
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
综上，视图矩阵的计算只需 9 个数字，分别是 **相机的世界坐标**、**相机的目标向量**、**相机的上方向向量**。

## 2.5. 将世界坐标系的某个点转换到相机坐标下

$$
\begin{align}
P_{view} & = M_{view} ·P_{world} \\ 
& = M_{view}·M_{model}·P \\
& = M_{modelView} · P
\end{align}
$$

# 3. 投影变换（Projection Transform）

视场内（远近平面内的区域）的物体投影到近平面，正交是视块，透视是四棱台。

## 3.1. 正交投影

往 $-Z$ 方向看，那么只需把 z 坐标去掉，结果就是投影到 $xOy$ 平面上的 **投影坐标** 了。

然后，把投影结果缩放到 $xOy$ 上的 $[-1, 1]^2$ 的区域内即可（方便后续裁剪坐标计算）。

在图形学的计算中，假定给定一个长方体，由 $[x_{max}, x_{min},y_{max}, y_{min},z_{max}, z_{min},]$ 六个值定义，不妨写成 $[right, left, top, bottom, near, far]$，简写成 $[r, l, t,b,n,f]$ 。其正交投影的顺序是：

- 平移至相机坐标系中心
- 不管多大，缩放到 $[-1,1]^3$ 这个立方体内

所以正交投影矩阵 $M_{ortho}$ 是：
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
\end{bmatrix}
\end{align}
$$

## 3.2. 透视投影

透视投影矩阵的目的是，将相机坐标系下的坐标投射到近平面。

假设远平面的所有点先向中心缩放，挤压缩放到和近平面的 xOy 视口一样大，然后再做正交投影即能得到最终的结果。