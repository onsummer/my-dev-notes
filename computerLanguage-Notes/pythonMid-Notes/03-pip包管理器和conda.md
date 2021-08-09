https://docs.python.org/zh-cn/3.7/tutorial/venv.html

https://zhuanlan.zhihu.com/p/90560471

# pip包管理工具

pip，就是python install package？

## pip install <包名>

没什么好说的，就是下载

- --upgrade：升级
- --user：仅为当前用户安装
- <包名>=<版本>：按版本安装

## pip show <包名>

显示信息

## pip list

列出当前环境中所有包。

和pip freeze是有区别的，pip list列出的是全部的包，freeze是安装的包（？）

## pip freeze > requirements.txt

类似于nodejs里的package.json。

把所有安装的包的信息写入这个txt文件中，把这个txt使用git同步起来，别人要用的时候只需install -r即可：

``` SHELL
pip install -r requirements.txt
```

