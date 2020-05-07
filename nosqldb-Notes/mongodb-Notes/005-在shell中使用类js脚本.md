https://docs.mongodb.com/manual/tutorial/write-scripts-for-the-mongo-shell/

# 快速入门

可以实例化一个Mongo对象。

``` JS
> new Mongo([<host>:<port>])
```

或者用变量接受：

``` JS
> conn = new Mongo()
> db = conn.getDB("myDatabase")
```

下面的写法也一样：

``` JS
> db = connect("localhost:27020/myDatabase")
```

