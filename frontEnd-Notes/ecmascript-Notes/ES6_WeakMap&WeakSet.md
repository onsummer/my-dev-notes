# WeakMap

- 键必须是对象
- 如果键的对象被 null 了，那么自动会删除 value

# WeakSet

- 只能存入对象
- 和 `Set` 不同，没有 size 和 keys()
- 如果存入的对象在外部清除，则 WeakSet 内的引用也会被干掉



> 总之
>
> WeakMap 和 WeakSet 存的是引用，在哪儿删除都会把堆上的数据删除
>
> Map 和 Set 是深拷贝了一份再存入，互不影响
>
> ``` js
> weakMap.set(john, "secret documents");
> // 如果 john 消失，secret documents 将会被自动清除
> ```



# 应用

## WeakMap

做结果缓存

传入参数对象 options，保留结果到 value

如果参数对象 options 一直不销毁，那么 value 就一直在 WeakMap 中缓存。

## WeakSet

做记录缓存