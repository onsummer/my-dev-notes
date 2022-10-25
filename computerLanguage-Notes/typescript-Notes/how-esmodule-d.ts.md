# 如何写 ESModule 的声明文件

---

## JS 模块文件：

```javascript
const fn1 = () => {
  console.log(123)
}

const fn2 = () => {
  return false
}

export const something = {
  fn1,
  fn2,
}
```

## d.ts 声明文件：

```typescript
export const something: {
  fn1: () => void,
  fn2: () => boolean,
}
```

即模块文件的声明文件一定要有 `export` 关键字：

```typescript
export {}
```


