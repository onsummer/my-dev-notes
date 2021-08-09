## ① get/set

全名 getter、setter，借鉴了 C#的属性

规则：

- 不能只有getter

``` JS
class Example {
    constructor(a) {
        this.a = a; 
    }
    get a() {
        return this.a;
    }
}
let exam = new Example(1); // 报错，因为 this.a 只是 getter，没有setter，无法执行 this.a = a
```

- 名称需一致，对应的变量加下划线（此时此变量仍然是public可见的）

``` JS
class Example {
    constructor(a) {
        this._a = a; 
    }
    get a() {
        return this._a;
    }
    set a(value) {
        this._a = value
    }
}
// value形参名称是任意的，setter的形参只能有一个
```

- **父类、子类各自拥有 get/set，互不干扰**

## ② 使用 super() 实例化父实例

规则：

- 必须、且只能出现在子类构造函数
- 必须在this前调用
- super关键字在子类普通方法中指向父类原型对象，静态方法中，指向父类（与C#的base一致）

## ③ *装饰器（和java的@一样，和C#的attribute一样）

装饰器用于修饰类、方法，但是不能修饰函数。它就是一个特殊的函数，它的参数是被修饰的东西。

``` JS
function dec(target) {
    console.log(target)
}

@dec
class A {}
```

如果还有别的参数，就要考虑别的写法了。

## ④ Object.defineProperty()

此静态方法用于为某个对象（或某个实例）定义属性，比 getter、setter 看上去貌似高级一些？

区别就是一个是定义在类上（原型上），一个是实例上

## ⑤ Object.defineProperties()

可以为某个对象（实例）定义一些属性。

以下用法等价。

``` JS
function Person() {}

Object.defineProperties(Person.prototype, {
    age: {
        // 定义 getter
        get: function() {
            return this._age
        },
        set: function(age) {
            this._age = age
        }
    }
})

// 属性名也可以用字符串

Object.defineProperties(Person.prototype, {
    "age": {
        // 定义 getter
        get: function() {
            return this._age
        },
        set: function(age) {
            this._age = age
        }
    }
})
```

``` JS
class Person {
    constructor() {
        this._age = undefined
    }
    get age() {
        return this._age
    }
    set age(age) {
        this._age = age
    }
}
```

除了 get、set外，还可以有别的属性：

``` JS
var obj = {}
Object.defineProperties(obj, {
    'property1': {
        value: true,
        writable: true
    },
    'property2': {
        value: 'Hello',
        writable: false
    }
})
```

详见 MDN