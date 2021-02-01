``` js
// 导入 axios

function ajax(url) {
  axios.get(url).then(res => gen.next(res))
}

function* steps() {
  const users = yield ajax(`https://api.github.com/users`)
  const firstUser = yield ajax(`https://api.github.com/users/${user[0].login}`)
  const followers = yield ajax(firstUser.followers_url)
}

let gen = steps()
gen.next()
```

函数执行步骤如下（从第一个 next() 开始）：

- 第一次 next()，执行第一个 yield 右侧的函数，此时进入 ajax(url)
- 发起异步请求，由于没有进行 next()，所以继续到 then() 传入的回调函数内，发起第二次 next()
- 第二次 next()，传入请求到的数据，此时代码流程走回生成器函数内的第一个 yield 左侧（因为第一次next只会执行到yield右边），将传入的数据返还至 users
- 代码在生成器函数内继续向前推进，执行第二次 yield，再次进入 ajax(url)，同理，没有进行 next() 之前都会继续当前代码，在then() 内发起第三次 next()
- 第三次 next()，传入请求到的数据，此时代码流程走回生成器函数内的第二个 yield 左侧（因为第二次next只会执行到yield右边），将传入的数据返还至 firstUser
- 代码在生成器函数内继续向前推进，执行第三次 yield，再次进入 ajax(url)，同理，没有进行 next() 之前都会继续当前代码，在then() 内发起第四次 next()
- 第四次 next()，传入请求到的数据，此时代码流程走回生成器函数内的第三个 yield 左侧（因为第三次next只会执行到yield右边），将传入的数据返还至 followers
- 生成器执行完毕，第四次 next() 返回值为 undefined





关键就是 next() 的调用时机，在哪里调用无所谓，只要调用的地方能访问 生成器变量即可。

next() 是重新开始上一次 yield 停下来的地方，将新一次 next() 的传入参数接收，并继续执行下一个 yield 右侧的必要条件。

next() 只会执行到 yield 关键字右边的代码，右边的代码的执行结果就是 next() 的返回值。

在本例中，虽然 yield 的右边都是 ajax() 函数的执行，但是这个函数并没有返回值，我们只是关心顺次请求数据而已，并不关心 ajax() 能返回什么。