# 普通类型



## 1. Boolean 类型

bool

## 2. 整型

u32和i32

## 3. 浮点类型



## 4. 标量类型

标量有 bool、i32、u32、f32 四种

按数值分，标量类型有 i32、u32、f32

按整型分，标量类型有 i32、u32



## 5. 向量类型

vecN\<T\>

vec2\<bool/i32/u32/f32\>

常说，T 就是组分类型（Component Type）

N 指维度，只能是 2、3、4



向量运算是逐元素进行的

``` wgsl
let x: vec<f32> = a + b; // a 和 b 都是 vec3<f32>
```



## 6. 矩阵类型

```
matNxM<f32>
```

N 和 M 是指矩阵的维度



```
mat2x3<f32>
```



## 7. 原子类型

```
atomic<T>
```

T 只能是 u32 或 i32



## 8. 数组类型

有两种重载

```
array<E, N>

array<E>
```

E 表示元素类型，N表示数组长度



举例

``` wgsl
var<private> a: array<f32, 8>;
var<private> b: array<i32, 8>;
var<private> c: array<f32, 8u>; // c和b的类型一样

let width = 8;
let height = 8;

// 类型 array<i32, 8>、array<i32, 8u>、和 array<i32, width> 是一样的
var<private> d: array<i32, width>;

// 类型 array<i32, height> 和 array<i32, width> 是一样的
var<private> e: array<i32, width>;
var<private> f: array<i32, height>;
```



举例2

用可覆盖的常量调整工作组（workgroup）的大小

``` wgs
[[override]] let blockSize = 16;

var<workgroup> odds: array<i32, blockSize>;
var<workgroup> events: array<i32, blockSize>;

// 下面的声明是无效的，因为对于 [[override]] 类型的长度只能用于 var<workgroup> 声明
var<private> bad_storage_class: array<i32, blockSize>;
```



## 9. 结构体





## 10. 复合类型

与之对应的是 4. 标量类型

有

- 向量
- 矩阵
- 数组
- 结构体

对于类型T，嵌套深度定义 `NestDepth(T)` 是：

- 向量是 1
- 矩阵是 2
- 对于元素类型是 E 的数组，1+NestDepth(E)
- 对于有泛型 M1，...，Mn 的结构体类型，1 + max(NestDepth(M1), ..., NestDepth(Mn))



## 11. 可构建的类型

创建、加载、存储、传递给函数，以及从函数中返回的类型，称之为可构造类型

主要有

- 标量类型
- 向量类型
- 矩阵类型
- 固定长度的数组
- 结构体类型（如果它的成员全都是可构造的）



## 12. 