# useRef

`useRef` 是一个 React Hook，它允许你引用一个不需要参与 React 组件渲染的值。

我知道这么说一定非常抽象，下面会举例。

``` js
const ref = useRef(initialValue)
```

# 用法

## 引用一个值

在组件最顶级作用域使用。

``` js
import { useRef } from 'react'

const Stopwatch = () => {
  const intervalRef = useRef(0)
  
  // ...
}
```

你可以在返回值的 `current` 属性访问到被引用的值。

我认为，新版 useRef 的文档最重要的表述就是：

> On the next renders, `useRef` will return the same object. You can change its `current` property to store information and read it later.

我们来翻译一下，“组件在下一次渲染时，执行到 `useRef` 的调用，它的返回值会返回一个和上次一样的值，你可以改变 `current` 属性来修改被引用的值。”

我并没有完全照翻，读者有能力可以自己体会一下这句话。

这很像 `useState` 返回的状态，但是，状态和 Ref 是有非常大区别的，原文紧接着也提到了这一点。

> **Changing a ref does not trigger a re-render.**

改变 Ref 的引用值并不会触发组件重新渲染。

例如，你要在组件中存储 `setInterval` 的返回 id，以便后续可以清除间隔函数调用：

``` js
const Stopwatch = () => {
  const intervalRef = useRef(0)
  
  const handleStartClick = () => {
    const intervalId = setInterval(() => { /* ... */ })
    intervalRef.current = intervalId // 这里就缓存了计时器的 ID
  }
  
  const handleStopClick = () => {
    const intervalId = intervalRef.current // 获取缓存的计时器 ID
  	clearInterval(intervalId) // 取消计时器
  }
  
  // ...
}
```

> 题外话，我一般把函数组件的渲染当成“执行一次组件函数”，组件每次执行，它里边儿的变量就会重新生成，无论是基本类型，还是复合类型，还是函数。

使用这个 hook，就意味着你知道：

- 在函数组件重新执行（触发了新的渲染）时，你可以缓存一些数据，它在每次渲染时都是一样的，不像函数组件内的局部变量，每次执行函数必定要重新创建
- 改变 ref.current 并不会触发重新渲染（重新执行组件函数）
- ref 的值独立于所有组件实例；这就和独立在组件之外的变量不一样了，组件之外的变量因为作用域高一级，所以对于所有组件是共享的

因为不会触发渲染的特性，所以 ref 的值并不合适放在返回的 JSX 中渲染，也就是 **不适合作为状态**，状态有状态的 hook，那就是 `useState`.



## 不要在渲染过程中渲染或改变 ref

还是重复一下上一小节中的题外话，渲染一次函数组件即“执行一次组件函数”。

那么，你就不应该在组件中改变 ref：

``` react
const MyComponent = () => {
  // ...
  
  // 改变 refA
  refA.current = 123;
  // ...
  
  // 渲染 refB
  return <h1>{refB.current}</h1>
}
```

对于改变 refA，显然每次组件更新后 refA 的值都会是 123，影响了下面可能对 refA 的值的正确读取；

对于渲染 refB，因为 ref 不触发组件更新，所以它首次渲染就作为静态值摆在那了，无论作何修改，它依旧是初次渲染那个值，并不会更新 JSX.

如果你实在是需要更改 ref 的值，建议在事件处理函数或副作用回调函数中修改，这是一种行为，是由前端触发的行为，是明确知道自己需要做什么的行为：

``` react
const MyComponent = () => {
  useEffect(() => {
    refA.current = 123;
  }, [someDep])
  
  const handleClick = (evt) => {
    refB.current = calculateSomething(evt)
  }
  
  // ...
}
```



## 可避免反复生成对象

考虑一种视频组件：

``` react
const Video = () => {
  const videoPlayerRef = useRef(new VideoPlayer())
  // ...
}
```

每次渲染 `<Video />`，就会执行一次 `useRef()`，也就会每次都重新生成 `VideoPlayer` 对象。

如果这个 VideoPlayer 对象非常复杂，创建它的成本很高（时间、内存等），你可以这么写：

``` react
const Video = () => {
  const videoPlayerRef = useRef(null)
  if (videoPlayerRef.current === null) {
    videoPlayerRef.current = new VideoPlayer()
  }
  
  // ...
}
```

写一个卫语句可以避免反复创建复杂对象，并且能起到缓存这个复杂对象的作用。

虽然在上一小节说过不要在组件渲染过程中修改 ref，但是这里是一个反过来想的巧妙用法。

# 适配场景

缓存具有复杂自我状态的对象（创建成本非常高），且这个对象不需要参与 DOM 渲染。

例如，GIS 相关库的对象；3D 相关库入口对象。

