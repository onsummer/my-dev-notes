# 基本数据类型

## ① 布尔、数字、字符串

``` typescript
let isDone: boolean = false
let age: number = 17
let msg: string = "hello world"
// es6 模板字符串也可以
let greet: string = `${msg}`
```

特别的，数字类型还支持二进制 `0b`、八进制 `0o`、十六进制 `0x`。

``` typescript
let hexNumber: number = 0xf00d
let otcalNumber: number = 0o744
let binaryNumber: number = 0b1010
```

## ② 数组、元组

- 普通数组

    普通数组使用方括号 [] 来定义。

    ``` typescript
    let list: number[] = [1, 2, 3]
    let names: string[] = ["Bob", "Lisa"]
    ```

- 泛型数组

    泛型数组用 `Array<T>` 定义。

    ``` typescript
    let list: Array<number> = [1, 2, 3]
    let names: Array<string> = ["Bob", "Lisa"]
    ```

- 元组

    元组是指定类型的数组，值的顺序和类型的顺序要一致。

    ``` typescript
    let x: [string, number] = ["hello", 17]
    ```

    

## ③ *枚举值

``` typescript
enum Color {Red, Green, Blue}
let color: Color = Color.Green
```

和大多数语言一样，可以为枚举类型指定顺序索引：

``` typescript
enum Color {Red = 1, Green = 2, Blue = 5}
let color: Color = Color.Green
let blueName: string = Color[5]
console.log(blueName) // 显示'Blue'
```

枚举值，默认是从0开始的数字。

当然也可以给字符串：

``` typescript
enum Message {
    Success = "Good",
    Fail = "Bad"
}
```

字符串就不能用 `Message["Good"]` 来获取 `Success` 了。

### 常量枚举

常量枚举在编译后不存在。普通枚举编译后会生成一个对象。

``` typescript
const enum Month {
    Jan,
    Feb
}
let month = [Month.Jan, Month.Feb]
```



## ④ *任意值any、object类型

`object` 表示除了 `number`、`string`、`boolean`、`bigint`、`symbol`、`null`、`undefined` 之外的类型。

不建议使用 `any` 类型

## ⑤ 空类型void、空值null、未定义undefined

- 空类型 `void`

``` typescript
function msg(): void {
    console.log("hello")
}
```

使用 `void` 来代表不返回东西。

有些函数没有返回值，就用这个。

- 未定义 `undefined` 和空值 `null`

由于 typescript 具有强类型功能，所以和 es 不太一样。

默认情况下，可以为任意类型赋予 `null` 和 `undefined`，例如：

``` typescript
let age: number = null // 或者 let age: number = undefined
let name: string = undefined // 或者 let name: string = null
```

但是在 `tsconfig.json` 里指定了选项 `--strictNullChecks` 时，除了 `any` 和各自的类型，`null` 和 `undefined` 就不能给别的类型的变量了。

``` typescript
// --strictNullCheck [ON]
let age: number = null // error
let gender: any = undefined // OK
```

**推荐启用 `--strictNullCheck` 选项。**

## ⑥ never

死循环和抛异常函数，啥都不会返回，所以要用never类型。

# 类型断言（即类型判断、转换）

与其他强类型的转换不太一样，ts 的类型转换在编译的时候起作用，并且并不是真的进行“转换”。

``` typescript
let someValue: any = "this is a string";
let strLength: number = (<string>someValue).length;
```

上述代码将原本 `any` 类型的变量 `someValue`，在编译时用 `(<string>someValue)` 的语法，**当作 `string` 类型**来处理，**并不作任何转换。**如果 `someValue` 的值并不是 `string` 类型，例如是 `number` 类型，就取不到 `length` 属性值。

还有另一种语法：

``` typescript
let someValue: any = "this is a string";
let strLength: number = (someValue as string).length;
```

使用 `as` 关键字可能更接近 C# 程序员的习惯，不过如果你使用 jsx，那么你只能使用 `as`。

