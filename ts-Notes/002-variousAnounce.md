# 变量声明

## ① 与es的不同

- 允许默认值

    ``` typescript
    function keepWholeObject(wholeObject: { a: string, b?: number }) {
        let { a, b = 1001 } = wholeObject;
    }
    ```

     