知乎的公式系统 tex

（和latex略兼容）

# 1. 分式

```
\frac {a}{b} # 行内会比较小
\displaystyle\frac{a}{b} # 这一种行内公式会比较大
```

$$
\frac{a}{b}
$$

## 1.1. 行内空格

```
\quad
```

# 2. 矩阵和行列式

```
\begin{matrix}1&2\\3&4\\ \end{matrix}
# 有括号的
\left[ ... \right]
\left( ... \right)
```

$\begin{matrix}1&2\\3&4\\ \end{matrix}$，有括号的：$\left[ \begin{matrix}1&2\\3&4\\ \end{matrix} \right ]$、$\left( \begin{matrix}1&2\\3&4\\ \end{matrix} \right )$

## 也可以用预定义

```
\begin{pmatrix} ... \end{pmatrix}  # 圆括号
\begin{bmatrix} ... \end{bmatrix}  # 方括号
\begin{Bmatrix} ... \end{Bmatrix}  # 花括号
```

$\begin{pmatrix} 1&2 \\ 3&4 \end{pmatrix}$、$\begin{bmatrix} 1&2 \\ 3&4 \end{bmatrix}$、$\begin{Bmatrix} 1&2 \\ 3&4 \end{Bmatrix}$

## 行列式

也是用预定义就可以了

```
\begin{vmatrix} \end{vmatrix}  # 一竖行列式，两竖就大写V
```

# 3. 函数

```
\
```

例如 \cos(x)
$$
\cos(x)
$$
你不加 \ 号可能就斜体了
$$
cos(x)
$$
还是有一点点区别的

## ① 上下标

```
e^x 或 e^{x}
```

$$
e^x
$$

```
e_x 或 e_{x}
```

$$
e_{x}
$$

## ② 开根号

```
\sqrt[n]{a}
\sqrt[\frac{2}{3}]{b}
```

$$
\sqrt[n]{a} \quad
\sqrt[\frac{2}{3}]{b}
$$

# 4. 向量

```
\vec{某}
```

$\vec{aaa}, \vec{AB}$

三个字母就不太够了

# 5. 方程组

```
\begin{cases} \end{cases}
# 每个方程之间的行间距 [<N>ex]，例如[2ex]
# 每个方程换行 \\
```

$$
\begin{cases}
 a_1x+b_1y+c_1z=\displaystyle \frac{p_1}{q_1} \\[1ex] 
 a_2x+b_2y+c_2z=\displaystyle \frac{p_2}{q_2} \\[2ex] 
 a_3x+b_3y+c_3z=\displaystyle \frac{p_3}{q_3} \\[3ex] 
\end{cases}
$$

# 6. 顶标（音调符号）

```
\acute{a} \check{a} \grave{a} \tilde{a} 
\bar{a} \ddot{a} \hat{a} \vec{a} 
\breve{a} \dot{a} \mathring{a}

\quad \dddot{a} 

\quad \ddddot{a}
```

$$
\acute{a} \check{a} \grave{a} \tilde{a} \\
\bar{a} \ddot{a} \hat{a} \vec{a}\\
\breve{a} \dot{a} \mathring{a} \\

\\ \quad \dddot{a} 
\\ \quad \ddddot{a}
$$

## 6.1. 长符号

```
\overleftarrow{abc} 
\overrightarrow{abc}
```

$$
\overleftarrow{abc} \quad \overrightarrow{abc}
$$

# 7. 微积分、累加

## 7.1. 积分号

```
\int
\iint
\iiint # 三重积分
```

$$
\int^{1}_{2} \frac{1}{x} \text{d}\text{x}
$$

## 7.2. 累加

```
\sum_{}^\infty a_n
\Sigma
```

$\displaystyle \sum_{n=0}^\infty a_n$，$\displaystyle \Sigma_{n=0}^\infty a_n$

两种是不一样的

累积用 \prod 或 \Pi

## 7.3. 极限

```
\lim_{x \to 0}
```

$$
\lim_{x \to 0}
$$

# 8. 换行对齐

```
\begin{align}
f(x) & = ax+b \\
& = b+ax \\
\end{align}
```

对齐开始之处用 &，换行用 \\\
$$
\begin{align}
f(x) & = ax+b \\
& = b+ax \\
\end{align}
$$

# 9. 行居中

markdown 可以用\$$ 来触发，知乎用末尾双反斜杠

```
a^2 = b^2 + c^2 \\
```

$$
a^2 = b^2 + c^2 \\
$$

# 参考

[知乎公式编辑器测试案例 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/31232001)

[知乎上的公式是怎么打出来的？ - 知乎 (zhihu.com)](https://www.zhihu.com/question/31298277)

[知乎「插入公式」诀窍 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/31188118)

[巨型TeX备份 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/31988162)