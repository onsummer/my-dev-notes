讲这个一定要对比着 ES5 来学。

## ① 静态方法

其实叫 “类方法” 更合适js的语境。

``` JS
// es5

function People() {}
People.sayHi = function () { console.log("hi") }

People.sayHi()
```

``` JS
// es6

class People {
    constructor() {}
    
    static sayHi() {
        console.log("hi")
    }
}

People.sayHi()
```

这个与 C# 的静态方法调用几乎一毛一样：

``` C#
public class People {
    public People() {}
    public static SayHi() {
        Console.WriteLine("hi");
    }
}

People.SayHi();
```

## ② 静态字段

### es5 的 “静态字段”：函数字段

``` JS
// es5
function People() {}
People.a = 2

// 调用
People.a // 2
```

与这个并不一样

``` JS
function People2() {
    a = 2
}
```

前面是把 `a` **挂在函数名上**，后面的 `a` 是函数内的一个私有变量，`People2.a` 是访问不到的。

### es6 的静态字段

``` JS
// es6
class People {
    static a = 2
}
People.a // 2

// 事实上还可以这么写
class People {}
People.a = 2
```

这个与前述es5例子一样。

``` JS
class People2 {
    a = 2
}
```

这个与前述私有变量的例子一样，只不过这里是不能用 let、const、var 来定义 a 的。

## ③ 实例方法、原型方法、静态方法

实例方法与 C# 里给类设置一个委托一样。

``` JS
class Person {
    constructor (callback) {
        this.callback = callback
    }
}

// 有别于C#的是，Person类并没有声明 let callback = null, 而是用 this 在 constructor 里声明
```

原型方法等价 C# 类自己的方法，每个实例都有相同的方法。

``` JS
// es5 
function Person() {}
Person.prototype.sayHi = function () {
    console.log("hi")
}

// es6
class Person {
    sayHi() {
        console.log("hi")
    }
}

// C#
public class Person() {
    public void SayHi() {
        // ...
    }
}
```

静态方法与 C# 的静态方法是一样的，上文已经提过，不再赘述。

## ④ class 与 function

- class 一旦定义就不能再定义，function会覆写
- class 定义前不能new，即不存在提升，function则存在提升