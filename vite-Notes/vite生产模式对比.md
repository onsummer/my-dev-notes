Vite2 生产模式 Cesium HelloWorld 文件体积对比

> 主要是对 vite.config.ts 中 build.minify 选项的配置。

# 1. build.target 默认

## 1.1 build.minify = false

vite.config.ts

``` typescript
import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    minify: false
  }
})
```

Cesium 主要的API打包到了一个叫 `vendor.<hash>.js` 的文件中，体积为 6154 KB

用户程序打包到了 `index.<hash>.js` 文件中。

耗时 40.6 秒。

## 1.2. build.minify = ‘esbuild’

``` typescript
import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    minify: 'esbuild'
  }
})
```

`vendor.<hash>.js` 体积仅为 3784 KB，用户程序文件也减小了一些。

耗时 41.8 秒。

## 1.3. build.minify = ‘terser’

此选项体积压缩最强，`vendor.<hash>.js` 体积仅为 3758KB。

> 天坑注意：
>
> ``` JavaScript
> window['CESIUM_BASE_URL'] = ''
> ```
>
> 这个东西最好在生产前就写好，否则会被 terser 混淆，导致 Cesium API 在请求资源时出现跨域等奇怪问题。

出乎意料的是，用户程序压缩效果直接降到 1KB.

耗时 64.2 秒。

# 2. build.target = ‘esnext’ 或 ‘es2015’（2015是最低目标）

经测试，目标为 ‘esnext’ 与默认几乎没什么区别。

## 2.1. build.minify = ‘terser’

耗时：64.9 秒 / 64.1 秒

`vendor.<hash>.js` 体积：3758 KB / 3756 KB

## 2.2. build.minify = ‘esbuild’

耗时：41 秒 / 42 秒

`vendor.<hash>.js` 体积：3784 KB / 3782 KB

## 2.3. build.minify = false

耗时：40 秒 / 39.7 秒

`vendor.<hash>.js` 体积：6154 KB / 6153 KB



# 3. 结论

| ↓target \\ minify →  |        false        |      ‘esbuild’      |    默认 ‘terser’    |
| :------------------: | :-----------------: | :-----------------: | :-----------------: |
|    默认 ‘module’     | 40s左右，6154KB左右 | 41s左右，3784KB左右 | 64s左右，3758KB左右 |
| ‘esnext’ 或 ‘es2015’ |     没什么变化      |     没什么变化      |     没什么变化      |

除了 window 下的全局变量 `CESIUM_BASE_URL` 需要在构建前明确指定外，对于 Cesium 项目没什么需要注意的地方了。



# 4. base 选项的使用

假设你想部署到 nginx 某个 location 下，例如想通过 `http://localhost:4879/vite_demo/` 来访问，那么这个时候 location 即 `vite_demo`：

``` nginx
location /vite_demo/ {
  alias html/cesium_app/;
  # 其他配置，允许跨域等
}
```

默认的 `base` 是 `/`，也就是说，打包好的资源文件会访问 `http://localhost:4879/assets/index.<hash>.js`

但是明显访问不到，这个地址才是正确的：

``` 
http://localhost:4879/vite_demo/assets/index.<hash>.js
```

此时，就需要修改 `base` 了。

改为：

``` typescript
import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  base: '/vite_demo/'
})
```

再构建即可，打包后的应用程序所有访问路径均会先加一个 `/vite_demo/`



# 5. publicDir 选项的使用

官方说法最准确。

作为静态资源服务的文件夹。这个目录中的文件会再开发中被服务于 `/`，在构建时，会被拷贝到 `outDir` 根目录，并没有转换，永远只是复制到这里。该值可以是文件系统的绝对路径，也可以是相对于项目根的路径。

总之，静态资源放这儿，构建时会扔到输出目录的根目录下，原封不动。默认是 `<root>/public`



# 6. 环境问题

环境是指开发环境或生产环境。

在模块文件中，均可使用如下 js/ts 变量：

`import.meta.env` 来访问一些值。

在 index.html 中就不行啦，如果要根据环境来选择 index.html 的话，需要 vite-plugin-html 插件。

当然，也可以创建不同的 `.env.*` 文件来加入新的环境值，参考官方文档即可。

主要的目的，就是实现开发模式和生产模式不同配置的麻烦事儿。

除了开发模式和生产模式，还可以自定义别的模式。