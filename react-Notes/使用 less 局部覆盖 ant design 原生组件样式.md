# 使用 less 局部覆盖 ant design 原生组件样式



仿照如下例子即可：

``` less
// src/my-style.less
.my-style {
  :global {
    // 需要覆盖的 ant design 原生组件选择器、样式，尽数写在此
  }
}
```

然后，在需要作用的组件上使用 `my-style` 这个类

```jsx
// src/App.jsx
import styles from './my-style.less'

function App() {  
  const anotherBtn = <Button type="primary">原生按钮</Button>
  return <div>
    {anotherBtn}
    <Button className={styles['my-style']}>我是即将被覆盖的按钮</Button>
  </div>
}

export default App
```

这样，被覆盖的按钮的样式就不再受原生样式约束了。

## 踩坑点：vite2 导入的 styles 对象似乎是个文本

目前只在基于 webpack 的各路脚手架中有效，可能是 vite2 的 less 配置我没配好。

vite2 在 devServer 时导入的是 `less` 文件本身的文本，并没有做预构建，应该是没配好，待研究。



# 特殊组件：Popover

`Popover` 组件不能作用于 `className`，而需要作用于 `overlayClassName`，因为 `Popover` 会挂在 `#root` 元素下。

```jsx
const over = <Popover overlayeClassName={styles['my-style']}></Popover>
```

