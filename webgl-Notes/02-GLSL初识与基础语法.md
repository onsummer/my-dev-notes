这里有两个着色器代码

``` GLSL
// 可以写注释，这是顶点着色器：VertexShader
void main(){
    gl_Position = vec4(0.3,0.0,1.0,1.0);
    gl_PointSize = 100.0;
}
```

``` GLSL
// 片元着色器：FragmentShader
void main(){
    gl_FragColor = vec4(1.0,0.4,0.6,1.0);
}
```

它们可以保存在后缀名为 `glsl` 的文本文件中，

既可以在 `<script>` 标签里写，获取其 `innerHTML`（前提是设置标签的属性 `type = "x-shader/x-vertex"` 或 `type="x-shader/x-fragment"`），

也可以写成 es6 字符串：

``` JS
let vs = `
void main(){
	gl_Position = vec4(0.3,0.0,1.0,1.0);
	gl_PointSize = 100.0;
}
`
```

# 说明

着色器代码十分近似C语言的风格，只不过有大量的系统定义变量

## 1 变量限定字

### ① **`attribute`** 

`attribute` 代表的是顶点着色器中要与 js 程序的缓存进行传递的数据，例如下面这个 `a_position` 变量，看名字就知道是跟 js 程序进行顶点数据传递的，事实上它也通过 `gl_Position = a_position;` 这行代码传递了。

``` GLSL
attribute vec4 a_position;
 
// 所有着色器都有一个main方法
void main() {
  gl_Position = a_position;
}
```

`attribute` 不仅仅可以是位置坐标，还可以是颜色、法线、uv等。

### ② **`uniform`** 

`uniform` 变量与顶点无关，例如转换矩阵、光源位置等。`uniform` 变量可以用在两种着色器中，而 `attribute` 只能用在顶点着色器中。

这种变量是只读的，而且必须是全局变量，它可以是除了结构体、数组外的任何数据类型，例如 `MAT4`。

与 `attribute` 一样，也是从 js 缓存中进行数据交换的桥梁。

### ③ **`varying`**

`varying` 变量必须是全局变量，它是两个着色器之间的桥梁，是顶点着色器向片元着色器传数据的通道。

`varying` 只能是 `float`、`vec2/3/4`、`mat2/3/4`。

### ④ 精度限定：`precision`

有三种精度：

``` GLSL
precision highp float a;
precision mediump float b;
precision lowp float c;
```

### ⑤ 常量限定：`const`

例如定义红色、单位矩阵：

``` GLSL
const vec4 red = vec4(1.0, 0.0, 0.0, 1.0);
const mat3 identity = mat3(1.0);
```

## 2 数据类型

### ① 基本类型

int、float、bool

### ② 预定数据类型

浮点矢量：vec2、vec3、vec4

整形矢量：ivec2、ivec3、ivec4

布尔矢量：bvec2...

矩阵：mat2、mat3、mat4

注意，矩阵是列优先的，mat4前4个元素是第一列。

### ③ 复合类型

结构体、数组

数组只支持一维数组，不支持pop和push操作，索引值只能是数字。

### ④ 函数

和C语言一样，但是可以有C++一样的先声明，丢到最后再实现的“规范声明”模式。

### ⑤ 其他

取样器类型，是一种内置的类型：`sampler2D` 和 `samplerCube`

声明例子：

``` GLSL
uniform sampler2D u_Sampler;
```

