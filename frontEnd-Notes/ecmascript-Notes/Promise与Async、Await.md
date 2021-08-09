# 1. 自己写个Promise

``` JS
const p = new Promise((resolve, reject) => {
   // resolve 和 reject 都是 function
   // 成功了执行 resolve()
   // 失败了执行 reject()
});
```

那么，resolve、reject在这里作为形参，那么实参是在哪里传进来的呢？是系统。

系统将函数传入Promise内部，当成功了，比如数据库查到了某个数据，则调用 `resolve()` 函数，给它传入一些数据，否则调用 `reject()` 函数，是报错还是返回错误信息，就看你的需求了。

那么，`resolve()` 和 `reject()` 执行时传入的数据最终会被谁接收呢？

``` JS
// then() 获取 resolve() 的信息
p.then(resData => {
    console.log(resData)
})
.catch(err => {
    console.error(err)
})
// catch() 获取 reject() 的信息
```

此处，`resData` 由 `resolve(resData)` 内部传递过来，`err` 则由 `reject(err)` 内部传递过来。

# 2. 用法

通常来说，要做某个事情的时候，我无法确定是否完成，但是我会给你一个准信儿，如果失败了怎么怎么样，如果成功了怎么怎么样。

那么，做这个事儿以前就是定义一个function然后执行，传递一个回调给它即可。

``` JS
// 旧的做法
function doSth(params, resCallback, rejCallback){
    // 处理params
    if (成功)
        resCallback();
    else
        rejCallback();
}
```

乍看没啥问题，但是存在回调地狱...

所以可以改为 返回 Promise：

``` JS
function doSth(params){
    // 处理点什么
    return new Promise((res, rej) => {
        // 处理点什么
        if (成功)
            res(成功结果数据)
        else
            rej(报错信息)
    })
}

doSth(xxx)
.then(成功结果数据 => {
    console.log(成功结果数据)
})
.catch(报错信息 => {
    console.log(报错信息)
})
```

一层还看不出什么，如果是链式调用，就可以一直 `then` 下去，只需一直 `res()` 传递新的 Promise 对象即可。

# 3. 异步之 async、await