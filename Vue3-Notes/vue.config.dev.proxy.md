# 前驱

使用cli版本：`4.2.0`

使用vue版本：`2.6.11`

webpack参考：https://webpack.docschina.org/configuration/dev-server

## 示例配置①

```js
proxy: {
  "/api": "http://localhost:3000"
}
```

例如，现在请求`'/api'`就相当于请求到`http://localhost:3000/api`

如果请求`'/api/dataset'`就相当于请求`http://localhost:3000/api/dataset`

嗯，在这里`http://localhost:3000`并不是vue内部webpack开启的node HTTP服务器，而是另一个后台程序在3000端口提供的服务接口，有可能是git服务，有可能是node express写的服务，也有可能是tomcat、nginx在3000端口开的服务，等等。

> 请求`'/api'`第一步是请求到哪里？
>
> 没错，就是vue内置的http服务器，你可以为其设置端口：
>
> ``` js
> devServer: {
>     port: xxxx,
>     proxy: {...}
> }
> ```
>
> 这就代表vue调用webpack的devServer，在后台开启了一个node HTTP服务器，尽管这个服务器功能很弱，不过对于开发调试来说足够了。

## 示例配置②

如果我不想在例子①里传递`'/api'`怎么办？

只需添加一个`pathRewrite`参数即可：

``` JS
proxy: {
    "/api": {
		target: "https://localhost:3000",
        pathRewrite: { '^/api': '' }
	}
}
```

这样，如果请求`/api/dataset`，就不是转发请求到`http://localhost:3000/api/dataset`了，而是`http://localhost:3000/dataset`

同理，如果请求`/api`，就变成了请求`http://localhost:3000`，因为`'/api'`被替换成了空格。

如果不想替换成空格怎么办？那就修改pathRewrite的值即可：

``` json
proxy: {
    "/api": {
		target: "https://localhost:3000"
        pathRewrite: { '^/api': '/remoteapi' }
	}
}
```

现在，请求`'/api'`，实际上最终会请求`http://localhost:3000/remoteapi`。

> 杠精：这个**'^'**号是干什么用的？
>
> 实际上这个是正则表达式。根据思否的说法[[点我]](https://segmentfault.com/q/1010000012607105)，**`'^/api'`** 应该拆分成 **`'^'`** 和 **`'/api'`** 两个字符串，其中 **`'^'`** 匹配的是字符串最开始的位置。
>
> 杠精2：`{'^/api': ''}`和`{'^/api': '/'}`有区别吗？
>
> 既然是替换，如果是后者肯定会变成双斜杠了，不过不要紧，webpack和node会帮你处理成正确的URL的。实际上就是没有区别。

## 示例配置③

有时候你想多个路由转发到同一个URL上，那么：

```json
proxy: [{
  context: ["/auth", "/api"],
  target: "http://localhost:3000",
}]
```

## 示例配置④（已经不是proxy的内容）

默认情况下，vuecli内部这个webpack调用的HTTP服务器主机名是`localhost`，但是，如果这台webpack调用的微型HTTP服务器想被外网访问，那么就需要做一下`host`参数的更改了。

`localhost`其实是域名，一般windows系统默认将localhost指向`127.0.0.1`，但是localhost并不等于127.0.0.1，localhost指向的IP地址是可以配置的。

首先我们要先知道一个概念，凡是以127开头的IP地址，都是回环地址（Loop back address），其所在的回环接口一般被理解为虚拟网卡，并不是真正的路由器接口。

首先，0.0.0.0是不能被ping通的。在服务器中，0.0.0.0并不是一个真实的的IP地址，它表示本机中所有的IPV4地址。监听0.0.0.0的端口，就是监听本机中所有IP的端口。

https://juejin.im/post/5df1c4f46fb9a0165d74dc00

```javascript
module.exports = {
    //...
    devServer: {
        host: '0.0.0.0',
        port: 3030
    }
}
```

