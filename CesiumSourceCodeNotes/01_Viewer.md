> 我原本想写日记的，但是不太现实。

# 源码下载
源码可以从源码包和发行包中的Source目录中获取。

Cesium的模块化机制从1.63版本开始，由原来的RequireJs变为ES6。但有可能是原先设计耦合的问题，内部依旧是ES5实现。

# 入口：实例化Viewer时到底发生了什么

写Cesium程序时，都写过这一句：
``` JS
let viewer = new Cesium.Viewer(dom)
```
或者这样
``` JS
let viewer = new Cesium.Viewer(dom, {
    terrainProvider: Cesium.createWorldTerrain()
})
```
那它究竟在后面发生了什么呢？

# Viewer.js

定位到302行，Viewer的构造函数如下：

``` JS
function Viewer(container, options) {
    ...
}
```

就从这个长达400多行的构造函数看起吧！

``` JS
// 304~309行
if (!defined(container)) {
    throw new DeveloperError('container is required.');
}
container = getElement(container);
```

这一步，是看看DOM元素是否存在，使用getElement模块判断是domID或者是DOM元素变量，并返回。

## 工具模块：defaultValue

``` JS
// 310行
options = defaultValue(options, defaultValue.EMPTY_OBJECT);
```

这一步是判断传进来的options对象是否为空，如果为空，那就使用空对象预设值（`defaultValue.EMPTY_OBJECT）`）。其中，`defaultValue`是一个重要的模块，它判断第一个参数如果是undefined，就把第二个参数作为它的值返回，如果不是undefined，那就返回它本身。

## 工具模块：defined

``` js
// 312~313行
var createBaseLayerPicker = (!defined(options.globe) || options.globe !== false) && 
(!defined(options.baseLayerPicker) || options.baseLayerPicker !== false);
```

这一步通过defined模块判断构造参数options是否有globe属性、baseLayerPicker属性来决定是否创建底图选择器控件。defined模块的作用就是，判断传入值是否定义，定义了就返回true。

329行将Viewer实例的this变量赋予给that变量。

331~344行是Viewer视图底下的一堆空间的div DOM元素创建。

346~362行，利用defaultValue模块和defined模块

- 判断传入参数options中scene3DOnly参数是否赋值，如果没有则默认为false，即是否仅使用3d场景的意思；

- 判断传入参数options中的时钟模型属性clockViewModel是否存在，来决定是用传入的时钟模型，亦或者是用系统的时钟模型；
- 判断传入参数options中是否定义了shouldAnimate属性，如果定义了，则将时钟的同名属性设为同样的值。

# 最初的一步: CesiumWidget创建

``` JS
// Cesium.js 364~388行
var cesiumWidget = new CesiumWidget(cesiumWidgetContainer, {
    imageryProvider: createBaseLayerPicker || defined(options.imageryProvider) ? false : undefined,
    clock : clock,
    skyBox : options.skyBox,
    skyAtmosphere : options.skyAtmosphere,
    sceneMode : options.sceneMode,
    mapProjection : options.mapProjection,
    globe : options.globe,
    // ... 太长了不贴了
});
```

这一步和创建Viewer很像，但是它却更接近数据承载体一步。

为了保证单元的完整性，CesiumWidget的实例化，后面再说。提前透露：高频API，Scene、imageryProvider、Globe等均在这一步继续创建。

# 其他的初始化

390~615行，是对Viewer的一些其他属性的初始化，分别是界面上的一众按钮、时间轴等控件的初始化，以及事件总管理者（EventHelper模块）的初始化、重要的DataSourceCollection/DataSourceDisplay的初始化。

在后面Viewer部分的笔记中，关于这些控件的初始化，还会继续详细展开。

DataSourceCollection/DataSourceDisplay属于数据范围，不列入Viewer部分的笔记中。

最后，将以上初始化的对象，全部注册注册为当前Viewer实例的属性，并将其中一些对象例如dataSourceCollection的一些事件一并注册到Viewer的原型上。



除了以上初始化之外，Cesium还默认为cesiumWidget注册了屏幕操作事件的点击、双击事件，方便初始化完成后能通过点击来拾取场景中的Entity（场景Scene、实体Entity是数据范围，不作详细介绍了），这两个事件使用cesiumWidget.screenSpaceEventHandler.setInputAction方法来注册。这两个事件位于构造函数的689~708行。

# 原型定义

## 工具方法：Object.defineProperties

这几乎是每一个Cesium模块都会做的一步，使用Object.defineProperties，为某个对象赋予某个属性。

> 据说这个Object.defineProperties是近几个版本才启用的，之前js没有这个方法时，是用Cesium.defineProperties的。

在Viewer.js模块中的711~1292行，官方为Viewer的原型定义了一大批属性，包括上文提及的初始化的多个对象、事件等，还包括上文创建的各个初始化的对象的一些属性快捷连接，以便能在Viewer实例上直接访问其他模块的属性。

例如你既能在Viewer上获取camera，也能在Scene模块获取camera，只不过Viewer上返回的camera也要先访问scene罢了。

随后，在1294~1523行和1724~1858行，为Viewer的原型定义了一堆API文档中能看到的公共方法；在1525~1703和1863~2056行为Viewer的原型定义了一堆私有方法。

# 导出Viewer模块

最后，在2066行，使用es6语法导出Viewer构造函数。



> 版权所有。转载请联系我，B站/知乎/小专栏/博客园/CSDN @秋意正寒

下篇预告：CesiumWidget的创建。

