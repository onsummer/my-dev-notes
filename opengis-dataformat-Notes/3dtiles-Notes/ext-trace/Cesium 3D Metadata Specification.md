# 0. 摘要



# 1. 介绍

``` 
features = geometry + metadata
// 即 要素 = 几何 + 元数据
```



# 2. 概念

## ① Classes：元数据类





## ② Instances



### Instances Table



### JSON 编码



### 二进制编码



### Metadata 纹理编码



### 编码比较



## ③ 将 元数据类 与 实例化 这两个概念区分





# 3. 类的定义



## ① 基本类型



## ② 归一化属性



## ③ 数组



## ④ 可选属性与默认值





# 4. 文件存储编码



## ① JSON 编码



### 基本类型



### 数值类型的位长



### 数组类型



### Blob Base64 编码



### 定长字符串和二进制大对象（Blob）



### 可选值和默认值



### 例子



## ② 二进制编码



### 数值类型



### 字符串和二进制大对象



### 定长字符串和二进制大对象



### 数组



### 变长数组



### 布尔值



### 二进制字节对齐



## ③ 元数据纹理编码



### 数值纹理



### 数组纹理



### 实现注意事项



# 词汇表

- **feature**
- **geometry**
- **metadata**
- **class**
- **property**
- **instance**
- **instance table**
- **buffer**
- **buffer view**
- **property array**
- **element**
- **component**
- **metadata texture**
- **encoding**



# metadata 中主要 json 对象

- class
- class.property
- metadata 本体
- tileset



# metadata_implicit_tiling 中主要 json 对象

- 本体
- ...