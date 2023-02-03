如何手动补充陈年老库（或纯 JS 代码）的 TypeScript 类型？

> 这篇仅为自己工作中在 js 和 ts 交叉斗智斗勇的实践中留下的经验，不一定完全、合理，仅供参考，有错漏难免，有则评论区指出。

# 前置知识 - JavaScript 的各种模块化情况

- 全局模块，在 `globalThis` 上可以访问，一般是 iife 库程序

- ES 模块

- CommonJS 模块

# 前置知识2 - 让你写的 d.ts 在工程中生效

- 确保当前工程目录中使用的 TypeScript 是 `node_modules` 下的开发依赖，快捷命令 `Ctrl` + `Shift` + `P`，选择 TypeScript 版本即可

- 在 `tsconfig.json` 中配置 `include` 项，使得你写的 `d.ts` 文件在 `include` 的路径中即可

# 1. 全局模块的定义

假设我有一个定义在 `globalThis` 上的库，名叫 `WebCC`，它很简单：

```javascript
window.WebCC = (function(){
  const foo = () => {
    console.log('foo')    
  }
  const bar = 'bar'
  const NAME = 'WebCC'
  return {
    foo,
    bar,
    NAME
  }
})()
```

那么，它应该使用 `namespace` 来定义：

```typescript
declare namespace WebCC {
  function foo(): void
  const bar: string
  const NAME: string
}
```

# 2. ES 模块的定义

仍以上述 `WebCC` 这个名字为例，但是这次是 ES 模块：

```javascript
// webcc.js
export const bar = 'bar'
export const NAME = 'WebCC'
export const foo = () => {
  console.log('foo')
}
```

那么，它应该使用 `module` 来定义：

```typescript
// webcc.d.ts
declare module 'webcc' {
  export const bar: string
  export const NAME: string
  export const foo: () => void
}
```

`module` 关键字后面的模块名即 import 时的模块名：

```typescript
import { foo } from 'webcc'
```

## 2.1. 默认导出

```typescript
declare module 'webcc' {
  const XXX: string
  export default XXX
}
```

## 2.2. 导出类

```typescript
declare module 'webcc' {
  export class Foo {
    /** 构造器 */
    constructor()
    /** 字段成员，类型为函数 */
    foo: () => void
    /** 字段成员，类型为 string */
    NAME: string
    /** 函数成员 */
    bar(): void
    /** 静态字段成员，类型为 number */
    static VERSION: number
  }
}
```

## 2.3. 注意事项

在模块声明的 `d.ts` 文件中，想引入其他模块的定义，不能像模块一样使用 `import` 指令，而是要使用 `import()`。例如，想在 `parser.d.ts` 中引入别人已经定义好的数据类型，来自 `@types/foo` 的 `Foo` 类型，那么要写成：

```typescript
declare module 'my-parser' {
  export parse(val: import('foo').Foo): string
}
```

这是因为一旦在代码文件顶部写了 `import` 就会被当作模块文件，而不是类型声明文件。这个特性来自 `TS 2.9` 版本。 



# 3. CommonJS 模块定义

CommonJS 的模块声明与 ES 模块声明大同小异，即 `module.exports.foo`（或简写 `exports.foo`）对应 `export foo`，`module.exports = foo` 对应 `export default foo`。

## 3.1. 挨个导出

```javascript
module.exports = {
  foo: function() {
    console.log('foo')  
  },
  bar: "bar"
}
```

类型声明为：

```typescript
declare module 'webcc' {
  export const foo: () => void
  export const bar: string
}
```

## 3.2. 默认导出

```javascript
module.exports = class WebCC {
  foo() {
    console.log('foo')   
  }
}
```

类型声明为：

```typescript
declare module 'webcc' {
  export default class WebCC {
    foo(): void
  }
}
```

# 4. 声明类型（TypeScript 中的 interface 或 type）和其它

## 4.1. type 和 interface

满足前置知识2 的前提下，在任意 `d.ts` 中书写的 `interface`、`type` 定义均可被整个项目使用：

```typescript
declare type WebCCOptions = {
  foo: string
  bar: boolean
}
declare interface WebCCResponse {
  foo: string
}
```

## 4.2. 全局变量（非 namespace）

全局变量也可以如法炮制：

```typescript
declare const WebCC: {
  foo: () => void
}
```

## 4.3. 补充功能

例如，想为原生数组补充一个新的函数成员 `foo`，先在某些地方实现：

```javascript
// somefile.js
Array.prototype.foo = function() {
  console.log('foo')
}
```

这个时候需要补齐这个类型：

```typescript
// somefile.d.ts
declare interface Array<T> {
  foo(): void
}
```

> 有的读者可能不知道为什么 Array 是 interface，那是因为这个是官方的定义，我只是点了点 F12 ... 毕竟 interface 才能继续补充定义，官方的 d.ts 更完善、强大，建议自学。
