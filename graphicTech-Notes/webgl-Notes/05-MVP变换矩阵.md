渲染流水就不细说了，主要有三大变换矩阵需要自己亲自推导一下。

# 1. 局部坐标到世界坐标的 M

这个 $M$ 是模型的 $model$  的首字母，即模型变换。它将局部坐标的三轴进行旋转，再将局部坐标的原点通过平移的两个过程用矩阵表示。（如果变换前和变换后的单位长度都一样就不用缩放啦，不然在平移前还得缩放一次）

我自己觉得 平移、旋转、缩放 的矩阵格式都很清楚了，故不再记录。

## 组合变换

尤其要注意旋转变换，那三个**旋转矩阵是相对于原点的**。

所以，物体不在原点（例如，某某模型位于远离地心的地表，想旋转模型本身就要先回归到模型局部坐标上来，否则会绕着地心旋转）的旋转物体本身，要把旋转中心定位到物体的中心。

即
$$
T^{-1}_{平移原点到物体中心}×R_{旋转物体}×T_{平移原点到物体中心}×(物体坐标xyz)​
$$


# 2. 世界坐标到相机坐标 V

也叫世界坐标到观察坐标（视图坐标），即视图（View）变换。

## ① 相机观察坐标系（视图坐标系）的定义

设想，摄像机的中心为 $P_1$，被观察物体的中心为 $P_2$

两点确定一条射线，摄像机的中心为观察坐标系的原点：$\vec{P_1P_2}$

这便是第一条轴。

规定一个相机的上方向向量 $\vec{UP}$，这个向量不一定与 $\vec{P_1P_2}$ 垂直，它只是用来标记

那么先确定第二条旁轴，使用叉积可以计算得到 $\vec{P_1P_2}$ 与 $\vec{UP}$ 确定平面的法向量，即观察坐标的横轴
$$
\vec{V} = \vec{P_1P_2}×\vec{UP}
$$
此时再计算 相机坐标的最后一条轴 $\vec{N}$ 就很容易啦：
$$
\vec{N} = \vec{V} × \vec{P_1P_2}
$$
所以相机为原点的相机坐标系由三个互相垂直的向量 $[\vec{P_1P_2},\vec{V},\vec{N}]$ 定义。

不妨把 $\vec{P_1P_2}$ 记作 $\vec{U}$，那么最终定义相机坐标系的三个向量为：
$$
\left[\begin{matrix} \vec{U}&\vec{V}&\vec{N} \end{matrix} \right]
$$


## ② 由世界坐标到相机坐标的步骤

先将世界坐标的原点移动到相机中心，平移向量即 $\vec{P_1}$

写成转换矩阵即
$$
\left[\begin{matrix}
E_{3×3}& P_1\\
O&1
\end{matrix}\right]
$$
然后进行旋转操作。

设世界坐标的三个单位向量是 $X=(1,0,0),Y=(0,1,0),Z=(0,0,1)$

设在①中求得的相机坐标三个轴单位化后的向量为 $U,V,N$，其中 $U$ 即 $P_1$

这样就得到了两个基 $[U,V,N]$ 和 $[X,Y,Z]$

> 基是什么？基就是定义了一个坐标系统的n个向量，二维的基有俩向量
>
> 如果构成基的向量是单位向量，那么就叫这个基是单位基
>
> 如果还是垂直的，那么就叫它 垂直正交基

两个坐标系的变换，可以看作两个基的变换。现在，求的是 世界坐标 $[X,Y,Z]$ 到 相机坐标 $[U,V,N]$ 的变换矩阵V：
$$
[U,V,N] = [X,Y,Z]×V
$$
由于 $[X,Y,Z]$ 在上面规定每个轴的向量都是单位向量，那么
$$
[X,Y,Z] = E = \left[\begin{matrix} 1&0&0\\0&1&0\\0&0&1 \end{matrix}\right]
$$
所以所求的变换矩阵为
$$
V=\left[\begin{matrix} U&V&N \end{matrix} \right]
$$
由①的定义，UVN三个向量是两两垂直的，那么求这个矩阵的逆矩阵就很容易了，因为有定理：

> 单位正交基矩阵的逆矩阵，即它的转置矩阵

$$
V^{-1}=V^{T}
$$



# 3. 相机坐标到投影平面 P

这个也叫投影变换。

投影变换根据性质，有两种：透视投影、正射投影。

## ① 相机坐标系到投影平面变换

说是到投影平面，其实只是规定了 深度轴 的值。

只要给出 张角、裁剪面的长宽比、远近裁剪面到相机中心的距离 4 个参数，就可以返回一个相机坐标到投影平面坐标的转换矩阵 P。

相机坐标 $P_0 = (x_0,y_0,z_0,1)$ （扩充了一维）到投影平面的坐标是 $P^{'} =(x^{'},y^{'},z^{'},w^{'})$

只需对 $P^{'}$ 的 xyz 除以 $w^{'}$，就可以进一步得到单位化的 NDC 坐标，也即所谓的 WebGL 坐标（WebGL的坐标不就是从 -1到1嘛）。

先看看它长啥样：
$$
\left[\begin{matrix} \frac{1}{长宽比×tan(半张角)} & 0&0&0 \\
0& \frac{1}{tan(半张角)}&0&0 \\
0&0&\frac{远+近}{近-远}&\frac{2×远×近}{近-远}\\
0&0&-1&0
\end{matrix}\right]
$$
然后推导它。

# 4. 思考

所以，无论你的模型的顶点数据是哪种坐标系的，你都得自己去考虑如何计算 M、V、P的过程

因为 WebGL 那个强大又简陋的 canvas 绘图区只接受 -1 到 1 的坐标，即 NDC 坐标，哦 NDC 到屏幕坐标这个过程浏览器帮你做了。

## 如果模型中心即世界中心

那么M就不需要计算了。

然后，你只需考虑摄像机坐标，这时候你只需要给一个摄像机的坐标，默认相机上方向是世界坐标的y轴即可。这样，就能获取到模型每个顶点在相机坐标中的坐标值。

然后就是计算投影坐标了，即创建一个 camera（终于知道为什么各大3dAPI都提供 camera了），然后获取其 P 矩阵，最后算到投影坐标，做透视除法，得到 NDC 坐标，丢给顶点着色器，完事~