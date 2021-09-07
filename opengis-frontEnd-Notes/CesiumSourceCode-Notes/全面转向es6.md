Cesium 新议题：源代码全面转向 es6 语法

> 原文：https://github.com/CesiumGS/cesium/issues/9718

# 原文翻译

既然在 1.84 版本移除了 IE 的支持，所以官方理应更新代码。

开始更新之前，需要确定几个事情：

-  更新代码指引
- 更新 eslint 配置

其他的：

- `when` 库与原生 Promise 对象不兼容，async 和 await 语法糖的更替会稍微延后，直到完全不依赖  `when` 库；
- 有些 ES6 的新特性性能还不如 ES5
- 用 `let` 和 `const` 来替换 `var` 应该可以开始考虑了，在 `gltf-pipeline` 项目的某个 [pr](https://github.com/CesiumGS/gltf-pipeline/pull/600) 开始已经有有关案例了。

有贡献者好奇到，使用 `let` 和 `const` 的话，代码能不能有实际的进步（有什么好处），或者有没有这方面的工具能一次性转换，否则人力转换会是一个很费劲的任务。

另外，还问到什么时候可以用 `for ... of` 循环来替代迭代相当长的对象：

``` js
for (var key in obj) {
  if (obj.hasOwnProperty(key)) {
    // ...
  }
}
```

以及其他的 ES6 新特性，都是需要考虑的。