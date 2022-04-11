结论：最终会生成 Primitive



---

文章状态：Draft

---





# 谁生成了 Primitive？

一种叫 Batch 的对象。实际上是 Visualizer



# 一切的起源在哪里？

Viewer.

``` js
Viewer.prototype._onTick = function (clock) {
  const time = clock.currentTime;
  
  const isUpdated = this._dataSourceDisplay.update(time);
  // ...
}
```



在 `CesiumWidget.prototype.render` 方法循环调用每一帧渲染时，会执行场景对象的 `render` 方法，但是无论该帧是否渲染场景，时钟对象始终会跳（tick）一次：

``` js
CesiumWidget.prototype.render = function () {
  if (this._canRender) {
    this._scene.initializeFrame();
    const currentTime = this._clock.tick(); // 这里
    this._scene.render(currentTime);
  } else {
    this._clock.tick();
  }
}
```



我们实例化 Viewer 的时候，私有的事件助手对象会为时钟的 `onTick` 时间注册 `Viewer.prototype._onTick` 方法：

```js
function Viewer(container, options) {
  // ...
  eventHelper.add(clock.onTick, Viewer.prototype._onTick, this);
  // ...
}
```



也就是说，每当 `CesiumWidget` 渲染一帧时，时钟都会跳一次，并顺带执行了 `Viewer` 的 `_onTick` 方法，进而去刷新 `DataSourceDisplay` 里的数据源（DataSource）。



# 为什么是 DataSourceDisplay

DataSourceDisplay 除了默认的 DataSource，还有一个容器字段，可能用于承载更复杂的 czml、geojson、gpx、kml 吧。

我也不知道。

默认的 DataSource 是 `CustomDataSource` 类型的，专门用来收集





## DataSourceDisplay （数据源示源）类

它有两个字段，`this._dataSourceCollection` 和 `this._defaultDataSource`，前者是 `DataSourceCollection`，是 `DataSource` 的容器，后者就是个默认的 `DataSource`。



# Visualizer（可视化器）类

可视化器（`Visualizer`）有若干个，位于源码的 `DataSources` 文件夹下，是 `DataSource` 类具体干活的“手下”。DataSourceDisplay 类初始化时，如果没有入参，那么会调用默认的初始化方法，来初始化 Visualizer：

``` js
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

第二个 `GeometryVisualizer` 比较抽象，其它的均为特定数据源服务，譬如 `ModelVisualizer` 服务于 `glTF` 模型实体。`GeometryVisualizer` 聚合了如下几何体的可视化功能：

- Box
- Cylinder
- Corridor
- Ellipse
- Ellipsoid
- Polygon
- PolylineVolume
- Rectangle
- Wall

点（Point）、路径（Path）、折线（Polyline）比较特殊，所以不用 `GeometryVisualizer`.



## 更新 Visualizer

`DataSource` 调用 `update` 方法时，会遍历其下所有 `Visualizer` 的 `update` 方法，会传入时间参数，以便更新数据。

### 创建 GeometryOptions

Visualizer 执行 update 时，会取 `_addedObjects` 里的 Entity，然后把 Entity 作为参数实例化 Updater。这个时候，有趣的事情就会发生，Entity 的参数会被 Updater 构造函数解构成为 `GeometryOptions` 对象。

### 几何并批

随后，使用 Visualizer 原型链上的 `_insertUpdaterIntoBatch()` 方法对 Updater 内的 `GeometryOptions` 进行同材质并批操作。

目前，CesiumJS 提供下列几种批次类型：

- `DynamicGeometryBatch`：_dynamicBatch
- `StaticOutlineGeometryBatch`：_outlineBatches
- `StaticGroundGeometryColorBatch`：_groundColorBatches
- `StaticGroundGeometryPerMaterialBatch`：_groundMaterialBatches
- `StaticGeometryColorBatch`：\_closedColorBatches、\_openColorBatches
- `StaticGeometryPerMaterialBatch`：\_closedMaterialBatches、\_openMaterialBatches

### 创建 GeometryInstance

不同的批次会使用不同的 Updater 去创建 `GeometryInstance`，这个行为的发生是在并批时（也就是 SomeBatch.add 时，还要继续向下深钻）。创建 GeometryInstance 的函数由 Updater 携带。



### 创建 Primitive

并批完成后，会在 Visualizer 的 update 方法最后循环更新批次，这个时候就会创建 Primitive 了。

``` js
// Visualizer.prototype.update
let isUpdated = true;
const batches = this._batches;
const length = batches.length;
for (i = 0; i < length; i++) {
  isUpdated = batches[i].update(time) && isUpdated;
}
```

看看批次类（以 `StaticGeometryColorBatch` 为例）的 update 方法：

``` js
Batch.prototype.update = function (time) {
  // ...
  let primitive = this.primitive;
  const primitives = this.primitives;
  // ...
  
  if (this.createPrimitive) {
    const geometries = this.geometry.values;
    const geometriesLength = geometries.length;
    if (geometriesLength > 0) {
      // ...
      primitive = new Primitive({
        // ...
      });
      primitives.add(primitive)
      // ...
    }
    
    // ...
  } // ...
}
```

注：这个 `Batch` 是私有类，会在 `StaticGeometryColorBatch` 的 add 方法上实例化。

终于看到了创建 `Primitive`，虽然省略了大量细节，而且省略了 `GeometryInstance` 的创建。



# Entity 如何传递给 DataSource 中的 Visualizer

秘诀在事件订阅机制。

``` js
EntityCollection.prototype.add = function (entity) {
  // ...
  
  fireChangedEvent(this);
  return entity;
}
```

这个 `EntityCollection.js` 模块内的函数 `fireChangedEvent()`，会继续触发 `EntityCollection` 的 `_collectionChanged` 事件：

``` js
function fireChangedEvent(collection) {
  // ...
  collection._collectionChanged.raiseEvent(
    collection,
    addedArray,
    removedArray,
    changedArray
  );
  // ...
}
```

而这个事件早就被实例化的 `GeometryVisualizer` 注册了：

``` js
function GeometryVisualizer(
  scene,
  entityCollection,
  primitives,
  groundPrimitives
) {
  // ...
  
  entityCollection.collectionChanged.addEventListener(
    GeometryVisualizer.prototype._onCollectionChanged,
    this
  );
  
  // ...
}
```

`GeometryVisualizer.prototype._onCollectionChanged` 是一个事件处理函数，这就不放源码了。它的作用就是把 EntityCollection 新增的（`addedArray`）、删除的（`removedArray`）、修改的（`changedArray`）Entity 归类到 Visualizer 对应的容器：`_addedObjects`、`_removedObjects`、`_changedObjects` 内，再往后，就由 Visualizer 使用 Updater 去创建 Primitive 了。





# 小结上文

## ① 容器准备

Viewer 实例化时创建了 DataSourceDisplay，DataSourceDisplay 有 DataSourceCollection 和 _defaultDataSource（即 CustomDataSource）。

当创建 _defaultDataSource 时，触发 _onDataSourceAdded 函数，其内部会调用一个方法 `_visualizersCallback`，为 _defaultDataSource 准备一批 `Visualizer`（可视化器）。这个 `_visualizersCallback` 实际上默认会用 `DataSourceDisplay.defaultVisualizersCallback` 静态方法，为每个可视化器注入 DataSource 的 entities（也就是 EntityCollection），并监听了这个 entites 的 `add` 回调事件。

所以，这些可视化器就有了访问 `EntityCollection` 的能力。

而 Viewer 上的 entites 容器，返回的就是默认数据源的 entites：

``` js
  entities: {
    get: function () {
      return this._dataSourceDisplay.defaultDataSource.entities;
    },
  }
```



## ② 数据更新

每当 entities 增加时，触发增项事件，此时改动的 entities 就会被可视化器收到。也仅仅是收到并存到 `_addedObjects` 等三个容器中。

而 Viewer 通过订阅时钟的 `_onTick` 事件，伴随 `CesiumWidget` 的渲染循环，每一帧都在刷新 `DataSourceDisplay`，也就顺带 update 了默认的 `dataSource`。

更新会实例化对应的 Updater，紧接着一连串地对 entity 进行拆装，变成 GeometryOptions → GeometryInstance → 几何并批 → 创建 Primitive → 加入到 dataSource 的 primitives 容器中（CustomDataSource 就是 scene 的 primitives 容器）。



# 渲染

到了 Primitive 后，其实就和之前差不多了，根据资源创建 DrawCommand，等待渲染。但是仍有一些不同的地方，那就是 Primitive 的 update，即几何处理。这部分会合成着色器、渲染状态、VBO/VAO，算是 CesiumJS 最引以为傲的部分了。以后有机会在讲。