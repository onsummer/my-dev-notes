3DTILES_implicit_tiling

---

[TOC]

---

# 依赖于

3D Tiles 1.0



# 可选与必需

如果瓦片分割规则用到了隐式分割，那么这项扩展必须同时出现在 `extensionsUsed` 和 `extensionsRequired` 数组中，即“必需的”。

# 1. 概述



# 2. Tile 对象中的扩展项写法



# 3. 空间分割方式



## 分割规则



# 4. 模板 URI



# 5. 子树（Subtree）



## 可用性（Availability）



## 瓦片可用性（Tile Availability）



## 瓦片内容可用性（Content Availability）



## 递归子树可用性（Child Subtree Availability）





# 6. subtree 文件格式



## buffer 与 bufferView



## 可用性数据的封装方式



# 附录A 可用性的索引

## 从坐标计算至莫顿码



## 可用性的字节流数据长度



## 访问可用性位数据



## 全局瓦片坐标、局部瓦片坐标



## 寻找父级瓦片与子瓦片