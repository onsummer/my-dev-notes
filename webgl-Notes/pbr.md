pbr 本质上还是以下若干基本材质因子的叠加：

``` GLSL
gl_FragColor = <自发光> + <环境贴图> + <颜色纹理贴图(漫反射)> + <镜面反射强度>
```

pbr 在以上各个因子的计算中，考虑了物理原理：能量守恒。各个模块的计算公式可以通过一系列复杂的数学计算推导而来。

这有一个十分经典的公式：
$$
L_{λ}(P,V)=
$$




# 参考

[由浅入深学习PBR的原理和实现 - 0向往0 - 博客园 (cnblogs.com)](https://www.cnblogs.com/timlly/p/10631718.html)

[猴子都能看懂的PBR（才怪） - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/33464301)