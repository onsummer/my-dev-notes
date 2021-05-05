根据网上半年前（写本文时，时间为2021年5月）的文章来折腾 Git 提交前自动使用 precommit 这个钩子功能进行代码格式化（不需要 eslint），无奈发现他们用的 husky 都是旧的，最后在一篇 vue3 的文章（[点我](https://www.imooc.com/article/316753)）（2021年3月）中发现了新版 husky 库的正确配置方法，故作记录。

# 自动安装

先决条件：

- 你的项目目录已经是 git 仓库
- 你的项目是 node 包



使用如下命令：

```
npx husky-init && yarn
```

（默认 yarn 是1.x）

这样，npx 命令会把 `husky` 库安装到开发依赖中，然后在项目根目录下创建 `.husky` 目录，并创建 `pre-commit` 钩子有关的文件与命令，打开 `.husky/pre-commit` 文件，最后一行是 `npm test`；

这个命令还对 `package.json` 中 `scripts` 属性添加了一条命令：

```
"prepare": "husky install"
```

这命令意思是，当这个 node 包触发 `prepare` 事件时，执行 `husky install` 命令。



# 手动安装

```
yarn add husky -D
npx husky install
npx husky add ./.husky/pre-commit
```

与上面的差不多，只不过过程上是手动的，并且 `package.json` 中 `scripts.prepare` 命令需要自己手动添加。



# 修改 pre-commit 为 npx lint-staged

先安装

```
yarn add lint-staged -D
```

配置 `package.json`：

```json
{
  "lint-staged": {
    "src/*/*.{ts,js,json}": [
      "prettier --write"
    ]
  }
}
```

修改 `./.husky/pre-commit` 文件要执行的钩子处理动作，即把原来的 `npm test` 修改为：

```shell
npx lint-staged
```

即可。