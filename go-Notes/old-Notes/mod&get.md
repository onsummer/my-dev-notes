## i导语

在 1.11 版本的 go 中，引入了模块管理机制，类似 npm、maven、deno（原生自带）、conda、pip、nuget等。

这个模块机制摆脱了 `$GOPATH` 的限制：必须设置且有且只有一个工作路径。

这个模块机制叫做 go mod，必须设定 GO的环境变量：

``` SHELL
go env -w GO111MODULE=on
# 或 go env -w GO111MODULE=auto
```

注意等于号两边不要有空格。并设置代理：

并设置代理：

``` SHELLL
go env -w GOPROXY=https://goproxy.cn,https://goproxy.io,direct
```

## 它解决了

- 自动管理依赖
- 项目不必再放到 `$GOPATH/src` 里了
- 第三方模块（包）会列出版本

## 下载的包放到哪里去了？

不像 `node_modules` 地狱，它把下载的第三方模块（包）放到 `$GOPATH/pkg/mod` 下，所以 GOPATH 还是有点用的。

# ① 初始化某个文件夹为mod（模块）

在任意位置创建一个文件夹：g3dtiles，这个包就叫 g3dtiles了

命令行cd 到这个目录下，执行以下语句：

``` SHELL
go mod init g3dtiles
```

不出意外会提示

``` SHELL
go: creating new go.mod: module g3dtiles
```

意味着这个 g3dtiles 文件夹成功被初始化为一个模块，并且这个文件夹下会出现一个 `go.mod` 文件。

## 比对 npm

上述操作类似 `npm init -y`

## 比对 ts

类似 `tsc --init`

## 比对 vuecli

类似 `vue create <项目名>`

## 比对 dotnet core

类似所有的 .NET CLI 创建工程的命令：

`dotnet new console` 等

具体dotnet 的命令参考：https://docs.microsoft.com/zh-cn/dotnet/core/tools/dotnet-new

## GOPATH

开启 GO111MODULE=on 后，

# ② 与 go get 结合管理模块

## 下载依赖包

和 `npm i` 类似，go的用法是

``` SHELL
go get -d -v ./...
```

其中，`-d` 表示仅下载，不install；`-v` 表示下载的日志会打印在控制台；`./...` 表示当前目录 `.` 下的所有文件 `/...` 都会下载。

## 检测某个模块的依赖并更新 go.mod 文件

``` shell
go mod tidy
# 例如 D:\codes\go-workshop\g3dtiles> go mod tidy
```

## 更新依赖

``` SHELL
go get -u
```



---

参考

[官方golang包管理神器，值得一试！](https://zhuanlan.zhihu.com/p/142176662)

[开始使用 Go Module](https://zhuanlan.zhihu.com/p/59687626)

[告别GOPATH，快速使用 go mod（Golang包管理工具）](https://www.jianshu.com/p/bbed916d16ea)

[三分钟掌握Go mod常用与高级操作](https://zhuanlan.zhihu.com/p/103534192)