# Vue.js 3.0到底带来了哪些变化

## 一、体验3.0 API

### 1. 初始化项目

``` bash
# 创建项目目录
mkdir vue-next-sample
# 初始化npm包
npm init -y
# 安装 Vue.js 3.0
npm i vue@next
# 安装webpack相关模块
npm i webpack webpack-cli webpack-dev-server -D
# 安装一些用到的webpack插件
npm i html-webpack-plugin mini-css-extract-plugin css-loader -D
# 安装Vue.js单文件组件的加载器
npm i vue-loader@next @vue/compiler-sfc -D
```

### 2.新建项目所需要的基本文件

```ba
-public
	-index.html
-src
	-App.vue
	-main.js
-package.json
-webpack.config.js
```



## 二、分析3.0的优势

没有this

更好的类型推导能力

更大的代码压缩空间

更友好的Tree Shaking支持

更灵活的逻辑复用能力

