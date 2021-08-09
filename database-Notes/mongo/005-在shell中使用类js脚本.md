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

# mongo命令和类脚本对比

|        Shell Helpers         | JavaScript Equivalents                                       |
| :--------------------------: | :----------------------------------------------------------- |
| `show dbs`, `show databases` | `db.adminCommand('listDatabases') `                          |
|           `use  `            | `db = db.getSiblingDB('') `                                  |
|     `show collections `      | `db.getCollectionNames() `                                   |
|        `show users `         | `db.getUsers() `                                             |
|        `show roles `         | `db.getRoles({showBuiltinRoles: true}) `                     |
|         `show log  `         | `db.adminCommand({ 'getLog' : '' }) `                        |
|         `show logs `         | `db.adminCommand({ 'getLog' : '*' }) `                       |
|            `it `             | `cursor = db.collection.find() if ( cursor.hasNext() ){   cursor.next(); }` |

# 执行脚本

## ①使用--eval选项

``` SHELL
mongo test --eval "printjson(db.getCollectionNames())"
```

## ②执行一个js文件

``` SHELL
mongo localhost:27017/test myjsfile.js
```

## ③加载js文件

``` JS
load("myjstest.js")
```

load()方法接受绝对路径或相对路径。

如果当前数据库位于`/data/db`，而`myjstest.js`文件位于`/data/db/scripts`，那么下面两句是等效的

```js
load("scripts/myjstest.js")
load("/data/db/scripts/myjstest.js")
```

load()方法没有搜索路径。