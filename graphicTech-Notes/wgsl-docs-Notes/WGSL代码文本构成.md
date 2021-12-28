# WGSL变量名

- 不能与关键词或保留关键词冲突
- 不能用双下划线开头
- 不能用单下划线作为变量名





# 特性（attribute）

WGSL 中的特性有：

- align
- binding
- builtin
- group
- interpolate
- invariant
- location
- override
- size
- stage
- stride
- workgroup_size



# 声明（declaration）与作用域（scope）

“声明”是给一个对象以名称的动作。

作用域是指声明结束后的代码区域。

某些对象由 WebGPU 实现并提供，这种预先声明过的变量的作用域是全局的，主要有内置函数和内置类型。

不允许重复声明。

与大多数语言的作用域规则一致，若某作用域内存在多个相同的声明，那么会选择最近的一个。

只有函数声明才能包括其它声明。

## 举例

看下面一段 wgsl：

``` wgsl
var<private> modf: f32 = 0.0;
var<private> foo: f32 = 0.0; // 第一个 foo 声明
var<private> bar: u32 = 0u; // 第一个 bar 声明
fn my_func(foo: f32) { // 第一个 my_func 声明, 第二个 foo 声明
  var foo: f32; // 第三个 foo 声明
  var bar: u32; // 第二个 bar 声明
  {
    var bar: u32; // 第三个 bar 声明
    var bar: i32; // 第四个 bar 声明
    for (var i: i32 = 0; i < 10; i = i + 1) { // 第一个 i 声明
      var i: i32 = 1; // 第二个 i 声明
    }
  }
  var bar: u32; // 第五个 bar 声明
}

var<private> bar: u32 = 1u; // 第六个 bar 声明

fn my_func() { } // 第二个 my_func 声明

fn my_foo( // 第一个 my_foo 声明
  my_foo: i32 // 第二个 my_foo 声明
) { }

var<private> early_use : i32 = later_def;
var<private> later_def : i32 = 1;
```

从上往下看：

- `modf` 是内置函数，无效
- 第一个 `foo` 声明是有效的，作用域是整个程序
- 第一个 `bar` 声明同上
- 第一个 `my_func` 作用域是整个程序
- 第二个 `foo` 声明是有效的，作用域直到 my_func 函数的结束；进入函数作用域后，foo 的调用均视作传入的参数
- 第三个 `foo` 声明无效，与第二个冲突
- 第二个 `bar` 声明有效，覆盖第一个 bar，作用域在 my_func 函数内
- 第三个 `bar` 声明有效，覆盖第二个 bar，作用域是花括号
- 第四个 `bar` 声明无效，与第三个冲突
- 第一个 `i` 声明有效，作用域直到循环体的结束
- 第二个 `i` 声明无效，与第一个 i 冲突
- 第五个 `bar` 声明无效，与第二个 bar 冲突
- 第六个 `bar` 声明无效，与第一个 bar 冲突
- 第二个 `my_func` 声明无效，与第一个 my_func 冲突
- 第一个 `my_foo` 有效，作用域是整个程序
- 第二个 `my_foo` 有效，作用域是第一个 my_foo 函数内
- `early_use` 和 `later_def` 声明有效，作用域是整个函数

