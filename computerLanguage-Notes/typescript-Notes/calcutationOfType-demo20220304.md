# 使用计算属性来计算自定义键名的对象类型

定义这么一个用于算出键名的类型：

``` typescript
type UniformReturnType<Prefix, Mapping> = {
  [Key in keyof Mapping as `${Prefix & string}_${Key & string}`]: Mapping[Key];
}
```

然后使用它：

``` typescript
type UniformMap = {
  time: number;
  mvp: number[];
}

type Test = UniformReturnType<'aaa', UniformMap>

/*
  Test === {
    aaa_time: number;
    aaa_mvp: number;
  }
*/
```



# 减去函数的第一个参数

使用 infer 来取参数

``` typescript
type SplitCallback<Func> = 
  Func extends (...args: [infer _, ...infer Rest]) => infer Return 
    ? (...args: Rest) => Return 
    : Func

type A = SplitCallback<(a: number, b: string, c: boolean) => void>

/*
  A === (b: string, c: boolean) => void
*/
```

