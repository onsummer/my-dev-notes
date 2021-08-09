修改prompt这个内置变量，可以实现修改提示文字的效果。

# 修改为行数字

``` shell
mongo
```

进入shell后，键入如下js代码：

```js
cmdCount = 1;
prompt = function() {
    return (cmdCount++) + "> ";
}
```

这样，shell的提示文字就变成了数字，回车就加1.

![image-20200509111118828](attachments/image-20200509111118828.png)

# 修改为linux风格提示

现在修改为"数据库名@主机名$"的提示：

```js
host = db.serverStatus().host;

prompt = function() {
	return db+"@"+host+"$ ";
}
```

效果：

![image-20200509111248548](attachments/image-20200509111248548.png)

# 更多效果

https://docs.mongodb.com/manual/tutorial/configure-mongo-shell/