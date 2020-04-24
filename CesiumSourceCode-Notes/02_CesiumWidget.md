> 四叶小天使！

# 上承

CesiumWidget实际上和Viewer差不多。以下两句代码用于初始化，效果是差不多的。

``` JS
const widget = new Cesium.CesiumWidget('id选择器')
```

``` JS
const viewer = new Cesium.Viewer('id选择器')
```

实例化Viewer必定会实例化一个CesiumWidget。CesiumWidget实际上代表的是**`三维数据可视区域`**，而Viewer除了包括可视区域，还包括各种控件（时间轴、右上角各种按钮、搜索框、时间拨盘等），更像是一个**`总体承载容器`**。Viewer能通过`extend()`方法扩充自定义的控件。

> 真正使用WebGL绘图的，还不是CesiumWidget模块，而是在CesiumWidget中实例化的Scene模块。
>
> 不过，CesiumWidget起了一个桥梁的作用，它将构造时传递的DOM元素（或ID选择器）再内嵌了一个canvas元素，再将此canvas元素传递给Scene，让Scene接着绘图。
>
> 比较Viewer和CesiumWidget和Scene分别作用的DOM元素，用一张图表示：
> ![](./imgs/image-20200330022653203.png)

# 构造原理

## DOM构造

``` JS
// function CesiumWidget(container, options)构造函数内，第180~207行
if (!defined(container)) {
    throw new DeveloperError('container is required.');
}
container = getElement(container);
options = defaultValue(options, defaultValue.EMPTY_OBJECT);

var element = document.createElement('div');
element.className = 'cesium-widget';
container.appendChild(element);
// ...
var canvas = document.createElement('canvas');
// ...
element.appendChild(canvas);
```

我忽略了一些内容。这不到30行代码，完成了上级Viewer的DOM元素判断，完成了本级DOM元素创建，并完成了下一级DOM元素——canvas的创建，判断了传递进来的options参数是否为空。

关于下一级DOM元素canvas，还配置了一些HTML相关的事件、配置等，不详细展开了。

这样，DOM的层级关系就制造完毕了。

接下来还有一些其他的小部件（例如商标版权等）以及分辨率等设置，位于`209~219`行。

`221~238`行，将CesiumWidget的私有变量赋值完毕，并调用`configureCanvasSize()`来调整canvas的尺寸。

## 场景及有关对象构造

在240~349行，是一个大大的try/catch块，CesiumWidget模块的构造函数这部分代码，完成了Scene、Globe、SkyBox、SkyAtmosphere模块的实例化。

而最终暴露到CesiumWidget的API中的，有camera、scene、imageryLayers、terrainProvider、screenSpaceEventHandler、clock这几个主要的对象。

**这让我十分郁闷的事情来了，某个模块的属性（例如CesiumWidget的属性——camera）并不是它原型上的，而是这个模块的别的属性的原型上的（camera属性其实是属于Scene模块的）。**不理解Js原型的同学可以理解为Java的类，原型是Js（ES5）实现面向对象的一个重要设计模式。

从以下代码可以看到：

``` JS
// CesiumWidget.js模块
Object.defineProperties(CesiumWidget.prototype, {
    // ...
    camera : { // 449行
        get : function() {
            return this._scene.camera;
        }
    },
    // ...
}
```

这种设计在Cesium的API中非常常见，原理归原理，API归API。想要弄清楚谁是谁的崽儿（Scene.camera），而不是被谁抚养的（CesiumWidget.camera），只能通过源码来知晓。

回归正题。

``` JS
// CesiumWidget.js，241~255行
var scene = new Scene({
    canvas : canvas,
    contextOptions : options.contextOptions,
    creditContainer : innerCreditContainer,
    creditViewport: creditViewport,
    mapProjection : options.mapProjection,
    // 太长了不贴了
    // ...
});
this._scene = scene;
```

实例化Scene对象，传递主要的构造参数，大部分来自CesiumWidget的构造参数options中。

``` JS
// CesiumWidget.js，257~260行
scene.camera.constrainedAxis = Cartesian3.UNIT_Z;

configurePixelRatio(this);
configureCameraFrustum(this);
```

指定摄像机的约束轴为Z轴，触发私有函数调整像素比例和摄像机视锥体。

``` JS
// CesiumWidget.js，262~271行
var ellipsoid = defaultValue(scene.mapProjection.ellipsoid, Ellipsoid.WGS84);

var globe = options.globe;
if (!defined(globe)) {
    globe = new Globe(ellipsoid);
}
if (globe !== false) {
    scene.globe = globe;
    scene.globe.shadows = defaultValue(options.terrainShadows, ShadowMode.RECEIVE_ONLY);
}
```

创建ellipsoid和globe，并传递给scene.

273~299行创建环境因素，主要是天空盒和太阳、月亮、大气环境。

302~314行创建影像数据源（若无，则调用createWorldImagery模块创建世界影像，和CesiumION的token有关）和地形数据源，并传递给scene。影像数据源和地形数据源均可以从options中获取，若options没有，则使用Cesium官方给的，需要注意token问题。

318~325行确定scene对象的视图模式是二维的、三维的还是哥伦布的（2.5D）。

316，333~341行给scene绑定了渲染错误事件处理函数。

327~331行，确定了是否使用默认的循环渲染机制（useDefaultRenderLoop属性），这个属性若为false，则需要手动调用CesiumWidget.render()渲染。还确定了在默认循环渲染机制时，目标帧速率（targetFrameRate属性）。

## 原型上的属性定义

```JS
// CesiumWidget.js，352~581行
Object.defineProperties(CesiumWidget.prototype, {
    container : {
        get : function() {
            return this._container;
        }
    },
    // ...
    // 太长不贴了
}
```

API文档中能看到的CesiumWidget的属性，均在此定义了，使用的是Object.defineProperties()方法。

## 原型上的方法定义

CesiumWidget.js中593~708行，是CesiumWidget的API中所有方法的定义。

- CesiumWidget.prototype.showErrorPanel = function(title, message, error) {...}
- CesiumWidget.prototype.isDestroyed = function() {...}
- CesiumWidget.prototype.destroy = function() {...}
- CesiumWidget.prototype.resize = function() {...}
- CesiumWidget.prototype.render = function() {...}

当渲染错误时，调用showErrorPanel方法，弹出个对话框。

如果CesiumWidget被销毁了，调用isDestroyed方法返回的是true。

destroy()方法用于需要销毁整个视图时。

当窗口大小发生变化时，调用resize方法调整canvas和camera。

render方法是自动调用的，通常不需要开发者关心，除非设置CesiumWidget.useDefaultRenderLoop为false。这个方法是用来渲染场景的。

# 导出模块

最后在709行，导出此模块。

``` JS
// CesiumWidget.js，709行
export default CesiumWidget;
```

> 版权所有。转载请联系我，B站/知乎/小专栏/博客园/CSDN @秋意正寒
> https://www.cnblogs.com/onsummer/p/12571972.html
