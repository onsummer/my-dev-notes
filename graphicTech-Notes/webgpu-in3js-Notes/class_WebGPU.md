# 类 WebGPU

这个类用于判断当前浏览器是否支持 WebGPU，不支持则返回一个带报错信息的 div 元素让用户知晓。

目前只有两个静态方法：

- `isAvailable`：判断 `gpu` 属性是否在 `navigator` 对象上。
- `getErrorMessage`：返回一个带报错信息且预定义好样式的 div。



# 用法

``` js
import WebGPU from './renderers/webgpu/WebGPU.js';

if (WebGPU.isAvailable() === false) {
  document.body.appendChild(WebGPU.getErrorMessage());
  throw 'No WebGPU support.';
}
```

