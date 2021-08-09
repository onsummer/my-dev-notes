# Vue.js 3.0到底带来了哪些变化

## 一、体验3.0 API

### 1.1 初始化项目

``` bash
# 创建项目目录
mkdir vue-next-sample
# 初始化npm包
npm init -y
# 安装 Vue.js 3.0
npm i vue@next
# 安装webpack相关模块
npm i webpack webpack-cli webpack-dev-server -D
# 安装一些用到的webpack插件
npm i html-webpack-plugin mini-css-extract-plugin css-loader -D
# 安装Vue.js单文件组件的加载器
npm i vue-loader@next @vue/compiler-sfc -D
```

### 1.2 新建项目所需要的基本文件

```ba
-public
	-index.html
-src
	-App.vue
	-main.js
-package.json
-webpack.config.js
```



## 二、分析3.0的优势

### 2.1 没有this

函数式了

### 2.2 更好的类型推导能力

### 2.3 更大的代码压缩空间

由于import {...} from 'vue'，使得导出的函数变量名可以被替换成更短的名字。

### 2.4 更友好的Tree Shaking支持

webpack可以删除没有用到的代码，例如lodash工具库

只需在`webpack.config.js`里启用压缩，就可以对vue导出的工具进行压缩

``` JS
module.exports = {
    // ...
    optimization: {
        // 模块只导出被使用的成员
        useExports: true,
        // 尽可能合并每一个模块到一个函数中
        // contatenateModules: true,
        // 压缩输出结果
        minimize: true
    }
}
```

前提是，es6模块导出的方法是export，而不是export default。

luckily，vue 3.x就有这个特性。这样，vue的内核就有极大的优化，与2.x不同，2.x会直接把整个Vue对象打包进去。

并且，这样就可以通过替换更短的变量名了，因为导出的都是函数变量。

### 2.5 更灵活的逻辑复用能力



## 三、语言特性预览

### 3.1 props（父子组件通信）

props仍然可以和2.x一样用，但是也可以放到setup的参数里

``` JS
export default defineComponent({
    // 暂时也可以和2.x一样接收属性
    // props: {
    //     text: String
    // },
    setup(props) {
        console.log(props)
        return {
            props: props
        }
    }
})
```

### 3.2 context.emit（兄弟组件通信）

setup接收props还接收ctx

``` JS
setup (props, ctx) {
    // ctx = {attrs, slots, emits}
}
```

### 3.3 Data/Method

在setup里写，在return里返回键值对就可以了

需要注意的是，Data需要用两个东西包装，值类型的用ref，引用类型的用reactive：

``` JS
import { defineComponents, ref, reactive } from 'vue'

export default defineComponents ({
    setup (props){
        const count = ref(1)
        
		const increment = () => {
            count.value++
        }
    }
})
```

在2.x中，methods里的方法必须是真函数，不能是lambda表达式箭头函数，这就会让人困惑，this究竟是什么：

``` js
export default {
    data() {
        return {
            text: "123"
        }
    },
    methods: {
        m1 () {
			return this.text // ???有人就以为this是m1所在的对象
        }
    }
}
```

所以，3.x就干掉了this

### 3.4 computed

现在可以从vue中导出

``` JS
import { defineComponent, computed } from 'vue'
```

### 3.5 Hooks（也就是mount函数）

现在可以从vue中导出

``` JS
import { defineComponent, onMounted, onUnmounted } from 'vue'
```

### 3.6 Mixin

本节是2.5的解释

例如，有一个不是组件的js功能模块，又要用到vue的ref来保存数据，用es6写出来是这样的：

``` JS
// ./utils/window-size.js
// version vue 3.x

import { ref, onMounted, onUnmounted } from 'vue'

export default () => {
    const width = ref(window.innerWidth)
    const height = ref(window.innerHeight)
    const update = e => {
        width.value = window.innerWidth
        height.value = window.innerHeight
    }
    onMounted(() => {
        window.addEventListener('resize', update)
    })
    onUnmounted(() => {
        window.removeEventListener('resize', update)
    })
    return {width, height}
}
```

在2.x中，mixin就是公共逻辑存放地，但是问题是，如果不知道mixin里写了什么，在组件中用mixin返回的东西的时候，根本不知道从哪里来的，也无法和当前组件的data里的属性或者vuex提供的属性区分开。

