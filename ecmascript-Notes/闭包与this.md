# 1 闭包

> UMD？

闭包是指，创造一个作用域，使得里面的变量获得私有权，外部不可访问。

利用 `function` 的特点，可以实现。

JavaScript 的函数，其内部的变量外部是无法访问的。

``` JS
function func() {
    let a = 18
    return a + "cm"
}

func() // 结果是 "18cm"
```

此时若查看变量 `a`

``` JavaScript
a // 报错，提示未定义
```

## 返回一个函数

``` JS
function _create() {
    let a = 100
    return function() {
        console.log(a)
    }
}

const fn = _create()
const a = 200
fn() // 100
```

这里 `fn()` 的调用结果是 `_create()` 内的变量 `a`，也即 `_create()` 方法的生命并未结束，内部的变量，例如 `a`，一直都在，直到 `fn` 被回收，那么 `_create()` 也被回收，内部的 `a` 才结束生命周期。

这就与第九行定义的 `const a = 200` 隔离了开来



# 2. this

## ① 普通函数调用：window

``` JS
function fn1() {
    console.log(this)
}
fn1() // window对象
```

## ② 对象方法调用：{} 本身

``` JS
const x = {
    age: 24,
    sayHi() {
		console.log(this)
    },
    wait() {
        setTimeout(function() {
            console.log(this)
        })
    }
}

x.sayHi() // { age: 24, sayHi: f, wait: f }
x.wait() // window
```

`setTimeout()` 归属于 window，所以执行传入的那个 function 时，输出的 this 自然就是 window。

`sayHi()` 方法执行时，它归属于 x 对象，自然输出的是 x 对象。

想让 `x.wait()` 输出 x 对象，其实很简单

``` JS
const x = {
    age: 24,
    sayHi() {
		console.log(this)
    },
    wait() {
        let self = this
        setTimeout(function() {
            console.log(self)
        })
    }
}

x.wait() // { age: 24, sayHi: f, wait: f }
```

总结：**this的值，取决于谁调用它。**

## ③ 类方法（es6 class）：实例本身

``` JS
class People {
    constructor(name) {
        this.name = name
        this.age = 16
    }
    
    sayHi() {
        console.log(this)
    }
}

const x = new People("Jelly")
x.sayHi() // People { name: "Jelly", age: 24 }s
```

## ④ 箭头函数的this：定义时的this

``` JS
const x = {
    wait() {
        setTimeout(() => {
            console.log(this)
        })
    }
}

x.wait() // { wait: f }
```

这里的 this 虽然调用者是 window 下的 setTimeout，但是输出却是 x。

原因就在于，这个箭头函数定义于 x 对象下，作为参数传给 setTimeout 罢了。

所以这个箭头函数里头的 this，就指向的是 “该箭头函数定义之处：x”。

## ⑤ 改变 this：bind、call、apply

- 使用时改变函数内的 `this`：用 **call**

  ``` JS
  function fn1() {
      console.log(this)
  }
  fn1.call({ x: "asd" }) // { x: 'asd' }
  ```

- 使用前改变：**bind**

  ``` JS
  function fn1() {
      console.log(this)
  }
  const fn2 = fn1.bind({ x: "qwe" })
  fn2() // { x: "qwe" }
  
  // 你也可以
  // fn1.bind({ x: "qwe" })()
  ```

- 使用时改变：也可以用 **apply**

  与 call 的相同点是，都是在函数使用时改变 this，而且新的 this 就是第一个参数。

  与 call 的区别是，call后续接的是任意个参数，apply接的是一个数组。

  ``` JS
  fn.call({}, 参数1, 参数2, ...)
  fn.apply({}, [参数1, 参数2, ...])
  ```

  严格模式下，apply如果第一个参数不是对象，那么就指向 fn 原来的this。