# 准备条件

- 确保安装并正常运行 npm 和 node

# 安装工具：pm2

``` bash
npm i -g pm2
```

可能失败的原因：npm 和 node 版本不匹配。

安装完后，`pm2` 其实是一个可执行程序，你可以通过

- `whereis pm2` (linux 查询) 

来看看它在哪。

它唯一的用途就是在后台运行 node 程序，不会占用终端的前端。

# 启动一个文件

``` bash
pm2 start ./server.js
```

随后，控制台会打印出一个表格，提示你启动了一个名为 `server` 的程序，与文件名同名。

# 重载 / 重启

``` bash
pm2 reload <name>
pm2 restart <name>
```

# 监听变化

带个 watch 参数即可。

# 显示某个已经启动的 app 的参数

``` 
pm2 show <name>
```

# 参考文档

https://tn710617.github.io/zh-tw/pm2/