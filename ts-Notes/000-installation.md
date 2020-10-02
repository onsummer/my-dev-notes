除了deno原生支持ts编译外，只能用node来安装ts。

``` shell
npm i typescript -g
```

然后在命令行中使用 `tsc` 命令就可以编译 `*.ts` 文件了。

---

# 直接运行文件不编译

安装：

``` SHELL
npm i ts-node -g
```

用 `ts-node` 即可运行 `*.ts` 文件了。

# 本地安装

``` shell
npm i typescript
```

此时，需要使用 `npx tsc *.ts` 来跑本地的 ts 编译器。

# 初始化 ts 包

使用命令（先npm init）：

``` shell
tsc --init
```

## 默认结构

`package.json` 中指定包的入口文件为ts文件