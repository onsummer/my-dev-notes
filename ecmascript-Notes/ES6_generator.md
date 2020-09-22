# 1. 干啥用的

先来一段

``` JS
function* listColors(){
    yield 'red'
    yield 'green'
    yield 'blue'
}

const colors = listColors()
```

语法挺简单，就function后面多了个*，然后 `yield` 了三个字符串

这个 `colors` 就是一个 **`generator`**，即生成器

## 怎么用它

``` JS
colors.next()
```

返回一个对象：

``` JSON
{
    value: "red",
    done: false
}
```

有迭代器那味儿了。

直到 `yield` 完所有值，next() 就没东西了

> 如果不执行 next()，是不会执行 function* 里面的代码的

实际上，所有的 yield 执行完后，生成器方法 function* 的生命周期才会结束。

# 2. 结合axios控制请求流程

``` JS
function* steps() {
    const users = yield req(`https://api.github.com/users`)
    const firstUser = yield req(`https://api.github.com/users/${users[0].logion}`)
    const followers = yield req(firstUser.followers_url)
}

const userGen = steps()
userGen.next()

function req(url) {
    axios.get(url)
    	.then(res => userGen.next(res.data))
}
```

这里，看到了 `userGen.next()` 其实是可以传值的，传递的值会在对应的 `yield` 语句中返回，第一个 yield 返回被 users 变量接收，第二个则由 firstUser 接收，等等。

这个例子执行顺序是：

```
userGen.next() → req() → userGen.next() → req() → ...
```

