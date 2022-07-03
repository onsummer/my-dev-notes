# API 用法回顾

只需传入参数对象，就可以简单地创建三维几何体或者三维模型。

``` js
const modelEntity = viewer.entites.add({
  id: 'some-entitiy',
  name: 'some-name',
  position: Cartesian3.fromDegrees(112.5, 22.3, 0),
  model: {
    uri: 'path/to/model.glb'
  }
})
```

`Entity API` 通常会被拿来与 `Primitive API` 比较，无外乎：

- 前者使用 Property API 使得动态效果简单化，后者需要自己编写着色器；
- 个体数量较多时，前者的性能不如后者；
- 后者支持较底层的用法，可以自己控制材质着色器、几何数据并批优化；
- ...

本篇感兴趣的是 `Entity API` 是如何从参数化对象到 WebGL 渲染的。

首先，上结论：**Entity 最终也会变成 Primitive**。

从上面简单的示例代码可以看出，使用 `Entity API` 的入口是 `Viewer`，它不像 `Primitive API` 是从 `Scene` 访问的。

这正是关于 `Entity API` 源代码和设计架构的第一个知识，**Entity  API 必须依赖 Viewer 容器。**

> 前提是只用公开出来的 API



# 1. 为什么要从 Viewer 访问 Entity API

`Viewer` 其实是 CesiumJS 长期维护的一个成果，它在大多数时候扮演的是 Web3D GIS 地球的总入口对象。今天的主角是它暴露出来的 `Entity API`，不过在介绍它之前，还要再提一提 `Scene` 暴露出来的 `Primitive API`

`Scene` 暴露出来的 `Primitive API` 是一种比较接近 WebGL 数据接口的 API，面对接近业务层的数据格式，譬如 GeoJSON、KML、GPX 等，`Primitive API` 就略显吃力了。

虽然可以做一些转换接口，不过 Cesium 团队结合自己研发的数据标记语言 -- CZML，配上内置的时钟，封装出了更高级别的架构。

CesiumJS 使用 `DataSource API` 和 `Entity API` 这套组合实现了复杂、动态空间地理数据格式的接入。



## 1.1. 高层数据模型的封装 - DataSource API

这个 API 其实是 `Entity API` 的基础设施，在源码文件夹下就有一个 `DataSources/` 文件夹专门收纳 `Entity API` 和 `DataSource API` 的源代码，可见重要程度之高。

首先，分别看定义在 `Viewer` 原型链上的两个属性 `entities`、`dataSourceDisplay`：

``` js
Object.defineProperties(Viewer.prototype, {
  // ...
  dataSourceDisplay: {
    get: function () {
      return this._dataSourceDisplay;
    },
  },
  entities: {
    get: function () {
      return this._dataSourceDisplay.defaultDataSource.entities;
    },
  },
  // ...
}
```

从上面两个 getter 看，`EntityCollection` 似乎是被 `DataSourceDisplay` 对象的 `defaultDataSource` 管辖的；`defaultDataSource` 是 `CustomDataSource` 类型的。

`Viewer` 拥有一个 `DataSourceDisplay` 成员，它负责所有 `DataSource` 的更新。接下来先介绍这个“显示管理器”类。



## 1.2. 显示管理器 DataSourceDisplay 与默认数据源 CustomDataSource

它随 `Viewer` 创建而创建，而且优先级相当高，仅次于 `CesiumWidget`；它自己则创建默认的 DataSource，也就是 `CustomDataSource`：

``` js
// DataSourceDisplay.js
function DataSourceDisplay(options) {
  // ...
  const defaultDataSource = new CustomDataSource();
  this._onDataSourceAdded(undefined, defaultDataSource);
  this._defaultDataSource = defaultDataSource;
  // ...
}
```

在这个 `CustomDataSource` 的构造函数里，就能找到 `Viewer` 暴露出去的 `EntityCollection`：

``` js
// CustomDataSource.js
function CustomDataSource(name) {
  // ...
  this._entityCollection = new EntityCollection(this);
  // ...
}

Object.defineProperties(CustomDataSource.prototype, {
  // ...
  entities: {
    get: function () {
      return this._entityCollection;
    },
  },
  // ...
}
```

所以，包含关系就说清楚了：

```
Viewer
┖ DataSourceDisplay
  ┖ CustomDataSource
    ┖ EntityCollection
```

> `DataSourceDisplay` 除了管着 `CustomDataSource` 这个服务于 Entity API 的默认数据源外，还管着其它的 DataSource，其它的都会装入 `DataSourceDisplay` 的 `DataSourceCollection` 容器下，譬如 `GeoJsonDataSource`、`CzmlDataSource` 等，在文档中搜 DataSource 关键字基本能找齐。



## 1.3. 默认的数据源 - CustomDataSource

默认的数据源的作用，就是给 `Entity API` 提供土壤。

但是不要轻易认为 `CustomDataSource` 只能给 `Entity API` 使用，在官方沙盒中可以找到直接使用 `CustomDataSource` 的例子的。本文



## 1.4. DataSource API 与 Scene 之间的桥梁

文章一开头就说了，`Entity` 最终是会转换成 `Primitive` 的。

目前为止，CesiumJS 有更新 `Primitive` 权力的对象，只有 `Scene` 上那个 `PrimitiveCollection` 才能更新 `Primitive`，进而创建 `DrawCommand`。

`DataSource API` 的管家是 `DataSourceDisplay` 对象，它拥有一个私有的 `PrimitiveCollection` 成员：

``` js
function DataSourceDisplay(options) {
  // ...
  const scene = options.scene;
  const dataSourceCollection = options.dataSourceCollection;
  // ...
  
  let primitivesAdded = false;
  const primitives = new PrimitiveCollection();
  const groundPrimitives = new PrimitiveCollection();
  
  if (dataSourceCollection.length > 0) {
    scene.primitives.add(primitives);
    scene.groundPrimitives.add(groundPrimitives);
    primitivesAdded = true;
  }
  
  this._primitives = primitives;
  this._groundPrimitives = groundPrimitives;
  
  // ...
  
  if (!primitivesAdded) {
    // 对于 dataSourceCollection.length 是 0 的情况
    // 使用事件机制把私有的 PrimitiveCollection 添加到 scene.primitives 中
  }
}
```

看得到，这个私有的 `PrimitiveCollection` 创建完成后，就把它添加到 `Scene` 的 `PrimitiveCollection` 中了，伴随着 `CesiumWidget` 调度的渲染循环进行帧渲染。

而这个私有的 `PrimitiveCollection` 通过层层传递，会传递到最终负责创建 Primitive 的方法中（负责 Entity 当前时刻的 Primitive 的 API 在最后一小节会提及，别急）

> `PrimitiveCollection` 支持嵌套添加，也就是 Collection 可以添加到 Collection 中，update 时也会树状逐级向下更新。



# 2. 负责 DataSource API 可视化的一线员工 - Visualizer

## 2.1. 为 CustomDataSource 创建 Visualizer

注意到 `DataSourceDisplay` 创建 defaultDataSource 时，它会主动调用 `_onDataSourceAdded` 方法：

``` js
// function DataSourceDisplay() 中
const defaultDataSource = new CustomDataSource();
this._onDataSourceAdded(undefined, defaultDataSource);
this._defaultDataSource = defaultDataSource;
```

这个方法会给 defaultDataSource 再创建一个私有的 `PrimitiveCollection`，塞入 `DataSourceDisplay` 的 `PrimitiveCollection` 中（好家伙，套娃是吧）；但是这不是重点，重点是在 `_onDataSourceAdded` 方法中会紧接着调用 `_visualizersCallback` 方法创建 **可视化器（Visualizer）**：

``` js
// DataSourceDisplay.prototype._onDataSourceAdded 中
dataSource._visualizers = this._visualizersCallback(
  scene,
  entityCluster,
  dataSource
);
```

`_visualizersCallback` 方法是 `DataSourceDisplay` 的一个私有原型链上的方法，可以在创建时自定义。简单起见，就当默认情况讨论吧，默认情况用的是 `DataSourceDisplay` 类的静态方法：

``` js
function DataSourceDisplay(options) {
  // ...
  this._visualizersCallback = defaultValue(
    options.visualizersCallback,
    DataSourceDisplay.defaultVisualizersCallback
  );
  // ...
}

DataSourceDisplay.defaultVisualizersCallback = function (
  scene,
  entityCluster,
  dataSource
) {
  const entities = dataSource.entities;
  return [
    new BillboardVisualizer(entityCluster, entities),
    new GeometryVisualizer(
      scene,
      entities,
      dataSource._primitives,
      dataSource._groundPrimitives
    ),
    new LabelVisualizer(entityCluster, entities),
    new ModelVisualizer(scene, entities),
    new Cesium3DTilesetVisualizer(scene, entities),
    new PointVisualizer(entityCluster, entities),
    new PathVisualizer(scene, entities),
    new PolylineVisualizer(
      scene,
      entities,
      dataSource._primitives,
      dataSource._groundPrimitives
    ),
  ];
};
```

静态方法是 ES6 Class 的说法，CesiumJS 作为一套 ES5 时代的源码，大家意会即可。这个方法会返回一个数组，数组内是一堆 `Visualizer` 对象。

每个 Visualizer 就负责一类 Entity 的具体可视化工作，譬如 `ModelVisualizer` 负责 glTF 模型类型的 `Entity` 的可视化工作，`Cesium3DTilesetVisualizer` 负责 3DTiles 数据集类型的 `Entity` 的可视化。

几何类型有几个比较特殊的，被单独拎出来作为可视化器，就是 `PointVisualizer`、`PathVisualizer` 和 `PolylineVisualizer`；其它的都被收入到 `GeometryVisualizer` 去了。

我就以 `GeometryVisualizer` 为例，解释可视化器究竟是如何转换 `Entity` 成 `Primitive` 的。

## 2.2. EntityCollection 与 Visualizer 之间的通信 - 事件机制

实际上，`CustomDataSource` 只是“拥有”`EntityCollection`，它让它管辖的 `EntityCollection` 在 `DataSourceDisplay` 这个管家中合理地作为一个数据源存在，并不负责监控 `Entity` 的变化（增删改）。

真正监听 `Entity` 变化的是通过 `EntityCollection` 的事件机制完成的，`EntityCollection` 无论发生什么变化，都会传递给 Visualizer，图解如下：

```
DataSourceDisplay
┖ CustomDataSource
  ┠ EntityCollection
  ┃      ↑
  ┃  事件机制监听变化
  ┃      |
  ┖ [Visualizers]
```

接下来看看代码中的实现。`EntityCollection` 原型链上的 `add/removeById/removeAll` 方法会执行一个模块内的函数 `fireChangedEvent()`，它最核心的作用，就是把增加、删除、修改的 `Entity` 通过事件触发通知给 Visualizer：

``` js
// function fireChangedEvent() 中
const addedArray = added.values.slice(0);
const removedArray = removed.values.slice(0);
const changedArray = changed.values.slice(0);

added.removeAll();
removed.removeAll();
changed.removeAll();
collection._collectionChanged.raiseEvent(
  collection,
  addedArray,
  removedArray,
  changedArray
);
```

其中，`added/removed/changed` 是 `Entity` 增删改时的临时保存容器，每次执行 `fireChangedEvent` 函数时都会把这三个容器清除。

在上面这段代码中，触发事件的还是 `EntityCollection` 本身，`fireChangedEvent` 只是把变动的、最新那个 `Entity` 取出并通知注册的回调。

Visualizer 在创建的时候，就给 `EntityCollection` 注册了事件：

``` js
// 在 GeometryVisualizer 的构造函数中
entityCollection.collectionChanged.addEventListener(
  GeometryVisualizer.prototype._onCollectionChanged,
  this
);
```

这就是说，每当 `EntityCollection` 有增删改变化时，`GeometryVisualizer` 的 `_onCollectionChanged` 就会收到变化的 `Entity`，并继续执行后续动作。

`Entity` 的属性修改是借助 `Property API` 完成的，它添加到 `EntityCollection` 时（`add` 方法），容器就会为该 Entity 注册属性变动事件的回调：

``` js
// EntityCollection.prototype.add 中
entity.definitionChanged.addEventListener(
  EntityCollection.prototype._onEntityDefinitionChanged,
  this
);
```

`_onEntityDefinitionChanged` 在 Entity 的 `definitionChanged` 事件触发后执行，即也是执行 `fireChangedEvent` 函数。



# 3. 时钟 - 如何让 Viewer 参与 CesiumWidget 的渲染循环

在前两篇文章中，详细解析了 `CesiumWidget` 是如何调度 `Scene` 的帧渲染的。

`CesiumWidget` 拥有一个时钟成员：

``` js
// CesiumWidget 构造函数中
this._clock = defined(options.clock) ? options.clock : new Clock();
```

默认的时钟会在每一帧渲染调度函数中 **跳动**：

``` js
CesiumWidget.prototype.render = function () {
  if (this._canRender) {
    this._scene.initializeFrame();
    const currentTime = this._clock.tick();
    this._scene.render(currentTime);
  } else {
    this._clock.tick();
  }
};
```

无论是否渲染，都会调用 `Clock.prototype.tick()` 方法跳动一次时钟，这个方法会触发 `onTick` 事件：

``` js
Clock.prototype.tick = function () {
  // ...
  this.onTick.raiseEvent(this);
  // ...
}
```

也就是这个重要的时钟，让 `Viewer` 通过事件机制参与了 `CesiumWidget` 调度的渲染循环。

`Viewer` 在构造函数中，先创建了 `CesiumWidget`，随后就为时钟注册了 `onTick` 的回调函数：

``` js
function Viewer(container, options) {
  // ...
  // eventHelper 是一个事件助手对象，此处为 clock 注册事件用
  eventHelper.add(clock.onTick, Viewer.prototype._onTick, this);
  // ...
}

Viewer.prototype._onTick = function (clock) {
  const time = clock.currentTime;

  const isUpdated = this._dataSourceDisplay.update(time);
  // ...
}
```

在 `_onTick` 方法中，第一件做的事情就是执行 `DataSourceDisplay` 的更新：

``` js
DataSourceDisplay.prototype.update = function (time) {
  // ...
  let result = true;
  
  let visualizers;
  let vLength;
  
  visualizers = this._defaultDataSource._visualizers;
  vLength = visualizers.length;
  for (x = 0; x < vLength; x++) {
    result = visualizers[x].update(time) && result;
  }
  
  // ...
}
```

这个更新方法其实就是 **进一步更新** `DataSourceDisplay` 中所有的数据源（无论是数据源容器中的还是默认的 `CustomDataSource` 的）的 **可视化器（Visualizer）**，可视化器在上一节已经介绍过它的创建和如何与 EntityCollection 绑定的了。

---

待介绍完各个层级的数据容器创建、事件的绑定后，终于可以把目光聚焦在渲染上了。

`CesiumWidget` 负责调度 `Scene` 的帧渲染，同时会跳动时钟对象，时钟对象的跳动又进而通知 `Viewer` 更新 `DataSourceDisplay` 下辖的所有 DataSource。

到这里，各个数据源对象的 Visualizer 才开始了创建 `Primitive` 之路。



# 4. Visualizer 的更新之路

## 4.1. 更新方法中的三个循环

仍以 `GeometryVisualizer` 为例。接续第 3 节的内容，`Viewer` 伴随着时钟对象的回调，会一路更新数据源对象的 Visualizer。

看看 `GeometryVisualizer` 的更新方法：

``` js
GeometryVisualizer.prototype.update = function (time) {
  // ...
  const addedObjects = this._addedObjects;
  const added = addedObjects.values;
  const removedObjects = this._removedObjects;
  const removed = removedObjects.values;
  const changedObjects = this._changedObjects;
  const changed = changedObjects.values;
  
  let i;
  let entity;
  let id;
  let updaterSet;
  const that = this;
  
  for (i = changed.length - 1; i > -1; i--) { /* ... */ }
  for (i = removed.length - 1; i > -1; i--) { /* ... */ }
  for (i = added.length - 1; i > -1; i--) { /* ... */ }
  
  addedObjects.removeAll();
  removedObjects.removeAll();
  changedObjects.removeAll();
  
  // ...
}  
```

更新方法会取三类 `Entity`（`_addedObjects/_removedObjects/_changedObjects`）进行逆序遍历，这三个容器在 2.2 小节中会通过 `EntityCollection` 的事件机制传递给 Visualizer。

遍历这些 `Entity` 是打算做什么呢？`Entity` 这个时候仍然是参数对象，还不能直接拿去创建 `Primitive`。在讨论为什么之前，先介绍两个东西，见 4.1 和 4.2：



## 4.1. Visualizer 的数据转换工具 - Updater

我们知道，`Entity` 使用 `Property API` 去修改实体的形状、外观，而这些动态值每一帧必须变成静态值传递给 WebGL，`Entity` 中的几何类型不少，CesiumJS 分别给这些几何类型的动态转静态的过程做了封装 —— 也就是叫做 Updater 的东西，来辅助几何类型的 Entity 的几何数据更新。

在 `GeometryVisualizer.js` 文件靠前的位置，你可以找到一个数组：

``` js
const geometryUpdaters = [
  BoxGeometryUpdater,
  CylinderGeometryUpdater,
  CorridorGeometryUpdater,
  EllipseGeometryUpdater,
  EllipsoidGeometryUpdater,
  PlaneGeometryUpdater,
  PolygonGeometryUpdater,
  PolylineVolumeGeometryUpdater,
  RectangleGeometryUpdater,
  WallGeometryUpdater,
];
```

这些就是对应的几何更新器。

你可以在这些几何更新器类中找到 `createXXXGeometryInstance` 的原型链上的方法，例如 `EllipsoidGeometryUpdater.prototype.createFillGeometryInstance` 方法。

这些方法就是最后创建 `Primitive` 时所需的 `GeometryInstance` 的创建者，它们依赖于时间，返回该时间的静态几何值。



## 4.2. Updater 的集合 - GeometryUpdaterSet

回到 `GeometryVisualizer` 的 `update` 方法，很容易发现那三个逆序循环在访问 `GeometryUpdaterSet` 类型的容器，这个容器是 `GeometryVisualizer.js` 模块内的私有类。

只有在遍历 `_addedObjects` 时才会创建 `GeometryUpdaterSet`，此时新来的 `Entity` 会传给这个集合。这个集合的左右也比较简单：

- 为新来 `Entity` 创建所有的几何更新器（这就是性能可能会出现问题的原因之一了）
- 为所有的几何更新器注册 `geometryChanged` 事件的响应函数

这个几何更新器集合创建完后，会存储到 `GeometryVisualizer` 中，并与 `Entity` 的 `id` 作绑定（方便其它两个逆序循环查找）。



## 4.3. 性能的提升 - Updater 的分批

之所以在 `GeometryVisualizer` 的 `update` 方法中还不能创建 `Primitive`，尽管 CesiumJS 已经把创建静态几何值的行为封装在 4.1 和 4.2 中提到的几何更新器中了，是因为涉及一个性能问题：几何并批。

WebGL 的特点就是，单帧内绘制的次数越少，就越流畅。`GeometryVisualizer` 如果不为这些接受来的 Entity 分类归并批次，而是粗暴地把每个 Entity 直接生成静态几何、外观数据就创建 Primitive 的话，有多少 Entity 就会有多少 Primitive，也就有多少 `DrawCommand`，性能可见会非常糟糕。

CesiumJS 在 `GeometryVisualizer` 中设计了一个分批的过程，也就是原型链上的 `_insertUpdaterIntoBatch` 方法。

在 `GeometryVisualizer` 更新时，三个列表循环中的两个（添加列表和更改列表）都会调用 `_insertUpdaterIntoBatch` 方法，把由于新增或修改 `Entity` 而创建出来的新的 Updater 做分批。

``` js
GeometryVisualizer.prototype.update = function (time) {
  // ...
  for (i = changed.length - 1; i > -1; i--) {
    // ...
    that._insertUpdaterIntoBatch(time, updater);
  }
  
  // ...
  
  for (i = added.length - 1; i > -1; i--) {
    // ...
    that._insertUpdaterIntoBatch(time, updater);
    // ...
  }
  
  // ...
}
```

而在 `_insertUpdaterIntoBatch` 方法中，能看到非常多的分支判断以及 `add` 操作，这就是将 Updater 根据不同的条件甩到 Visualizer 上不同的批次容器中的过程了。

关于批次容器，会在第 5 节中讲解。



## 4.4.  Visualizer 更新的最后一步 - 批次容器更新

待 Visuailzer 更新方法的三个循环结束后，也就意味着完成了 Updater 的分批。

Updater 分批完成后，自然就是更新这些批次容器，进而创建出当前时刻的 `Primitive`，让他们等待 `Scene` 的渲染了：

``` js
GeometryVisualizer.prototype.update = function (time) {
  // ...
  
  let isUpdated = true;
  const batches = this._batches;
  const length = batches.length;
  for (i = 0; i < length; i++) {
    isUpdated = batches[i].update(time) && isUpdated;
  }

  return isUpdated; 
}
```

直到这时，`Primitive` 所需的 `Appearance` 和 `GeometryInstance` 仍然没有创建，它将延续到本文的第 5 节中完成。



# 5. 批次容器完成数据合并 - Primitive 创建

在临门一脚之前，我还是想介绍完批次容器。

## 5.1. 批次容器的类型与创建

CesiumJS 目前版本提供了若干种批次容器：

- `DynamicGeometryBatch`：_dynamicBatch
- `StaticOutlineGeometryBatch`：_outlineBatches
- `StaticGroundGeometryColorBatch`：_groundColorBatches
- `StaticGroundGeometryPerMaterialBatch`：_groundMaterialBatches
- `StaticGeometryColorBatch`：\_closedColorBatches、\_openColorBatches
- `StaticGeometryPerMaterialBatch`：\_closedMaterialBatches、\_openMaterialBatches

上面列出的，前者是类型，冒号后面的是 Visualizer 的成员字段（也就是具体批次容器对象），从名称不难看出它们的不同之处，大部分是用材质或颜色来作为分类依据。

上述批次容器可以在 `DataSources/` 文件夹中找到对应的模块以及导出的类。

你可以在 `GeometryVisualizer` 的构造函数中找到创建这些成员字段的代码（其实构造函数里大部分代码也是在创建批次容器）。它们最终会合并到 `_batches` 数组中方便遍历：

``` js
this._batches = this._outlineBatches.concat(
  this._closedColorBatches,
  this._closedMaterialBatches,
  this._openColorBatches,
  this._openMaterialBatches,
  this._groundColorBatches,
  this._groundMaterialBatches,
  this._dynamicBatch
);
```



## 5.2. 内部批次容器

没想到吧？上面列举的，名字上使用材质或颜色来区分的批次容器，还只是一个代理人。真正起存储作用的，还得看这些批次容器模块文件中内部的 `Batch` 类。

以最简单的静态批次容器 `StaticGeometryColorBatch` 为例，它在 Updater 通过 `add` 方法添加进来时，就会创建内部 `Batch`，同时创建这个时刻的 `GeometryInstance`：

``` js
// StaticGeometryColorBatch.js

function Batch(
  primitives,
  translucent,
  appearanceType,
  depthFailAppearanceType,
  depthFailMaterialProperty,
  closed,
  shadows
) {
  // ...
}

StaticGeometryColorBatch.prototype.add = function (time, updater) {
  // ...
  const instance = updater.createFillGeometryInstance(time);
  // ...
  
  const batch = new Batch(/* ... */);
  batch.add(updater, instance);
  items.push(batch);
}
```

这个内部 `Batch` 存放着外观信息和 `GeometryInstance` 对象。



## 5.3. 创建 Primitive

在 Visualizer 的更新方法中，最后就是对所有批次容器进行更新。仍以 `StaticGeometryColorBatch` 为例，它的更新方法会调用一个模块内的 `updateItems` 函数，这个函数对传入的某部分内部 `Batch` 执行更新：

``` js
// StaticGeometryColorBatch.js 中

function updateItems(batch, items, time, isUpdated) {
  // ...
  for (i = 0; i < length; ++i) {
    isUpdated = items[i].update(time) && isUpdated;
  }
  // ...
}

StaticGeometryColorBatch.prototype.update = function (time) {
  // ...
  if (solidsMoved || translucentsMoved) {
    isUpdated =
      updateItems(this, this._solidItems, time, isUpdated) && isUpdated;
    isUpdated =
      updateItems(this, this._translucentItems, time, isUpdated) && isUpdated;
  }
  // ...
}
```

`StaticGeometryColorBatch` 上的 `_solidItems` 和 `_translucentItems` 都是普通的数组，保存的是模块内部定义 `Batch` 类型的对象。

而这些内部 `Batch` 的更新函数，最终就会根据手上的资料，完成 `Primitive` 的创建：

``` js
// StaticGeometryColorBatch.js 中

// ... 这个方法很长，节约篇幅
Batch.prototype.update = function (time) {
  let isUpdated = true;
  let removedCount = 0;
  let primitive = this.primitive;
  const primitives = this.primitives;
  let i;
  
  if (this.createPrimitive) {
    const geometries = this.geometry.values;
    const geometriesLength = geometries.length;
    if (geometriesLength > 0) {
      // ...
      primitive = new Primitive({ /* ... */ })
      primitives.add(primitive);
    } // else ...
  } // else ...
}
```

而这个内置 `Batch` 上的 `PrimitiveCollection`（`this.primitives`），则是由 `CustomDataSource` ~ `GeometryVisualizer` ~ `StaticGeometryColorBatch` 一路传下来的，它早已在本文 1.4 小节中提及。

至此，`Entity` 终于穿过九曲十八弯，完成了静态 `Primitive` 的创建，终于可以把事情交给 `Scene` 继续做了，等待 `Scene` 在帧渲染流程中更新 `PrimitiveCollection` 进而创建出 `DrawCommand`，等待 WebGL 绘制。

最后，补个关系图：

```
Viewer
┖ DataSourceDisplay
  ┖ CustomDataSource
    ┠ EntityCollection
    ┃      ↑
    ┃  事件机制监听变化
    ┃      |
    ┖ GeometryVisualizer
      ┠ GeometryUpdaterSet
      ┃ ┖ [Updaters]
      ┃      ┃
      ┃    ┎─┸─ 创建→ Primitive
      ┃    ┃
      ┖ [Batches]
```



# 本篇小结

我本来是想写 `Entity API` 的设计架构的，但是为了弄清楚这个比渲染循环复杂得多的架构（主要是事件回调机制到处穿插，显得复杂），我做了很多细碎的文章片段，最后收拢在一起的时候，才挖出 CesiumJS 中 `DataSource` 这套高层级的数据模型的架构设计。

虽然 `Entity API` 从参数化 JavaScript 对象到 `Scene + Primitive API` 这一层的路线比较长，但是易用性提高却是事实。

`Scene + Primitive API` 作为基底，本身是比较高效率的，也留下了自定义的入口。`Viewer + DataSource/Entity API` 更进一步，使得 CesiumJS 更易于简单业务的实现。

我觉得写完几何类型的 `Entity` 渲染架构，就算点到为止了（其它类型的 `Entity` 有专属的 Visualizer，请读者带着几何类型的 `Entity` 的思路类比），CesiumJS 中的三维物体渲染架构设计就算解读完成。

渲染的细节、三维物体的创建行为、渲染调度优化仍然值得细细挖掘、学习，不过我认为都要基于渲染架构的基础之上。

之后要写的就是三维地球的骨架和皮肤了，就是旋转椭球体和瓦片四叉树设计架构。
