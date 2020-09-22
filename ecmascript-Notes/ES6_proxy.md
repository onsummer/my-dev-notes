# 1. 干啥用的

``` JS
const person = {
    name: 'Harry',
    age: 11
}

const personProxy = new Proxy(person, {
    get(target, key) {
        // 截获get操作
    }
})

console.log(personProxy.name)
```

这个东西和 class 中的 getter、setter 等很像，但是这个操作的对象是 **实例对象**，而 getter、setter 作用的是 **类**。

proxy 截获了所有对对象的操作，例如 get 属性、set属性等，就相当于给对象代理了一层，限制了对原始对象的各种访问操作。