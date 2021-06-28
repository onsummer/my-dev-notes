# 0 何谓状态

一切描述某个事物的 条目 皆可称为状态。例如，一个学生是否放假（布尔值），她今天的作业有哪些（数组变化）。

用一个简单的 js 对象来写大概是：

```js
const student = {
  isSummerDay: true,
  homeworkList: [], // 显然，她没有作业
}
```

> 我并不是很想跟你提前说 XState、Recoil 的原理，需要先学什么概念，我倾向于带着需求直接编码，状态管理库更多的用途是帮我解决问题，而不是我先得学那么多，我才能干活。

# 1 状态库来描述这些状态

## ① XState

```js
// studentStore.js
import { Machine } from 'xstate'

export const studentStore = Machine({
  states: {
    isSummerDay: {},
    homeworkList: {}
  }
})
```

## ② Recoil

```js
// studentStore.js
import { atom } from 'recoil'

export const studentStore = atom({
  key: 'studentStore',
  default: {
    isSummerDay: false,
    homeworkList: null
  }
})
```

