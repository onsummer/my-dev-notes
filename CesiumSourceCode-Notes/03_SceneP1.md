> 鹅哈哈。Scene比Viewer、CesiumWidget实例化的过程还长，分篇写。

# 上承

Scene模块是由CesiumWidget模块实例化时创建的。Scene模块非常非常大。

官方对Scene的描述为：

> Scene是所有3D图形和状态的容器。通常，Scene由CesiumWidget隐式创建，开发者并不需要自己实例化。

# 构造

## WebGL的舞台：canvas

Scene模块作用于canvasDOM元素。canvas用于WebGL绘图。也就是说，Scene在构造时，在构造参数options中必须传递canvas，否则会抛异常。

构造函数从157行开始。158~169行是获取并配置一些小控件、canvas元素和WebGL配置项（options.contextOptions）。

这个options.contextOptions十分有意思，它的说明在API帮助文档里都有。在170行写道：

``` JS
// Scene.js 170行
contextOptions.webgl.powerPreference = defaultValue(contextOptions.webgl.powerPreference, 'high-performance');
```

它规定了Cesium默认的性能选项是“high-performance”，这是最近几个版本才加入的默认配置，因为现在绝大多数运行Cesium的电脑性能已经不会很差了。

来到178行：

``` JS
// Scene.js 178行
var context = new Context(canvas, contextOptions);
```

实例化一个上下文模块，Context模块并不是CesiumAPI的模块，是内置模块。这个模块并没有太多的说明文档，但是根据粗浅的阅读Context模块的构造函数，大致判断此模块是初始化canvas的WebGL用的，内分支判断是否使用WebGL2、获取canvas的gl对象、设置缓冲区及WebGL有关配置信息等。

这个话题已经超出了Cesium源码的范围，属于WebGL范围。读者只需注意，Scene.js模块这一行的意义就是初始化Cesium所需的WebGL环境即可。

179~191行，依旧是一些商标等DOM的初始化。

## 属性构造

从193行开始一直到737行构造函数结束，一直在为Scene实例设置属性。

这段非常长，对一些焦点属性进行拣选讨论。

``` JS
// Scene.js 193行
this._id = createGuid();
```

创建ID，没什么好说的。

194~199行是渲染有关的代码，可暂时不作理会。

### Scene.primitives

``` JS
// Scene.js 200~205行
this._canvas = canvas;
this._context = context;
this._computeEngine = new ComputeEngine(context);
this._globe = undefined;
this._primitives = new PrimitiveCollection();
this._groundPrimitives = new PrimitiveCollection();
```

这部分绑定了canvas和webgl上下文，同时声明了globe属性（**尽管Globe的实例化是CesiumWidget构造函数中完成，并赋予给scene对象的**），**实例化了图元容器——PrimitiveCollection，和地表图元**。

我们经常会用到Scene.primitives.add()来添加primitive，primitive是Cesium中非常重要的一个三维矢量数据容器，另一个则为Viewer.entities.

关于数据容器`[imageryLayers/terrainProvider/primitives/entities/dataSource]`在未来的数据篇会切开学习研究。

### 大量渲染相关的代码

207~737行是Scene对场景渲染以及WebGL有关的代码，暂时看不懂，跳过。（真的不是不负责，我也很想知道每一行原理...）

但是也不是说不能讲点什么，例如，熟悉的几个事件均穿插在这里实例化：

- preUpdate：数据更新前
- postUpdate：数据更新后
- renderError：渲染错误
- preRender：数据渲染前
- postRender：数据渲染后
- morphStart：场景形变开始
- morphComplete：场景形变完成

（好像水了一段，毕竟每个模块，如果有自己的事件，肯定会在构造函数实例化）

Scene模块拥有的还不只有数据体，还有环境要素，例如`skyBox(298行)`、`skyAtmosphere(306行)`、`sun(314行)`、`moon(331行)`、`backgroundColor(341行,如果没有天空盒就用这个颜色)`、`fog(549行, 大气雾化消隐远处图形)`、`shadowMap(557~561行, 阴影)`、`light(731行)`等。

``` JS
// Scene.js 599行
this.postProcessStages = new PostProcessStageCollection();
// 渲染完成后，所谓的“后期画面”的定义处，类似ps或者说Ae做的事情。
```

``` JS
// Scene.js 343行
this._mode = SceneMode.SCENE3D;
// 场景维度。默认是3D视角。
```

接下来这一行代码，用于实例化一个处理canvas交互时的鼠标事件与相机视角的关系的控制器。

``` JS
// Scene.js 608行
this._screenSpaceCameraController = new ScreenSpaceCameraController(this);
```

### 按需渲染

如果想提高性能，则需要把requestRenderMode改为true，仅当场景发生改变时请求渲染。

``` js
// Scene.js 658行
this.requestRenderMode = defaultValue(options.requestRenderMode, false); 
// 默认是false，无论scene是否改变时时刻刻都在渲染
```

此属性需要配合Scene.requestRender()方法使用。

除了这两个地方，其实在渲染相关的代码中是可以调整WebGL有关的代码的，但是这需要不错的WebGL知识储备。

### 摄像机

以下为默认的摄像机。

``` JS
// Scene.js 684行
var camera = new Camera(this);
```

以下为场景初始化时摄像机动画用的摄像机。

``` JS
// Scene.js 696行
this.preloadFlightCamera = new Camera(this);
```

## 初始化场景

在构造函数的最后，初始化Scene的frameState、摄像机等，使用私有方法。

``` JS
// Scene.js 734~736行
updateFrameNumber(this, 0.0, JulianDate.now());
this.updateFrameState();
this.initializeFrame();
```

有关frameState，还得深入195行实例化的FrameState模块，不过这应该在未来渲染部分有重头戏，先留着吧。

# 总结

Scene实例化了绝大部分的环境因素，例如光、大气、天空模型等，还实例化了摄像机（camera）。

尤其重要的是，用于存放三维图形（三维模型）的高性能容器——`Scene.primitives`.

Scene还拥有地球这个球形本体——globe属性，但是Globe并不由Scene自己的构造函数实例化，而是由CesiumWidget构造函数后于Scene实例化而实例化。

> 为什么呢？
>
> 回看了CesiumWidget源码，考虑到CesiumWidget实例化时，构造函数会把影像源（imageryProvider）和地形源赋给globe对象，但是globe对象必须先赋给scene对象。这就搞不懂Cesium这么设计的缘由了（可能是我功底太浅）。

Scene的原型定义见后续两篇，包括原型上的属性和方法，这与API文档是一模一样的。我仍然会略过一些WebGL及渲染方面的代码，待日后WebGL学成归来，再细品。

Scene模块大概就学到这些，有些匆忙，有些潦草，速战速决，后面路还远着呢。

> 版权所有。转载请联系我，B站/知乎/小专栏/博客园/CSDN @秋意正寒
> https://www.cnblogs.com/onsummer/p/12596323.html
