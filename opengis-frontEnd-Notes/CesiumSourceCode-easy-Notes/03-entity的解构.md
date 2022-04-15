# 1. 容器的生成与关联绑定

Viewer → [CesiumWidget → Scene → PrimitiveCollection，DataSourceDisplay] → [PrimitiveCollection，CustomDataSource → [EntityCollection，_Visualizer_]]

理清几条线索

- 【Viewer 与 Scene 同步渲染】Viewer 创建 CesiumWidget，CesiumWidget 创建 Clock；CesiumWidget 负责渲染循环调度，其中就包括 Clock 的跳动；Viewer 通过注册 Clock 的 onTick 事件回调函数，完成与 CesiumWidget 的时钟同步
- 【Viewer拥有DataSource容器与显示对象，以及EntityCollection，Scene没有】DataSourceDisplay 有一 DataSource 的增加回调函数，会为每个新增的 DataSource  调用可视化器的生成函数去创建可视化器
- 【EntityCollection如何与DataSourceDisplay、CustomDataSource联动】CustomDataSource 创建 EntityCollection 时会传入 owner；而通过模块内的 `fireChangedEvent()` 函数，在 EntityCollection 发生任意变动时，都会执行这个函数，内部触发 `_collectionChanged` 事件；而 DataSourceDisplay 为 CustomDataSource 创建 _Visualizer_ 时都会传入 CustomDataSource 的 EntityCollection，每个 Visualizer 都会给 EntityCollection 这个 `_collectionChanged` 事件注册回调函数。这样，一旦调用前端 API 增删改 Entity，EntityCollection 就会触发事件，通知 Visualizer 把变动的 Entity 记录下来
- 【Viewer如何更新】答案就在时钟同步上，它的 `_onTick` 会被时钟的 `onTick` 事件回调，直接刷新 DataSourceDisplay，进而刷新 CustomDataSource，进而刷新每一个 Visualizer，进而刷新每一个 Batch，进而刷新每个 Batch 的内部 Batch，进而创建 Primitive 并推入 Scene 的 PrimitiveCollection，进而被 Scene 的更新创建绘制指令
- 【Visualizer是做什么的】它负责翻译 Entity 到 Primitive 的过程，借助一种叫 Updater 的载体；其中为了性能优化，要做分批，所以还要对 Updater 进行分类，分类的容器是几种 Batch，没分类前的容器叫做 GeometryUpdaterSet；由每个 Batch 负责从 Updater 中取材料，创建 GeometryInstance、Appearance，进而创建 Primitive（不一定完全由 Batch 容器创建 GeometryInstance、Appearance、Primitive，有些 Updater 也可以，譬如 DynamicGeometryUpdater、PlaneGeometryUpdater 等）
- 【Property机制如何实现】每当 Visuailzer 更新时（以 GeometryVisualizer 为例）会创建 GeometryUpdaterSet，同时会把 Visualizer 记录变动的 Entity 传给 Set，随即 Set 就会与 Entity 的 definitionChanged 事件绑定，一旦 Property 更新，就会通知 GeometryUpdaterSet 更新 Updater，这样使用 Updater 创建各类 Primitive 原材料时就是最新的了。



## 2. 



先是看 Entity 的基本操作，引出 EntityCollection 和 DataSourceDisplay、CustomDataSource 几个表面上的类。

紧随就画个图，EntityCollection 对接 CustomDataSource，Entity 对接其下的？

谁负责对接？DataSourceDisplay

环境在谁之下？Viewer；如何运作？借助事件订阅机制，使用时钟跳动 + CesiumWidget 的渲染循环来实现每一跳刷新 DataSourceDisplay。 -- 引出离开 Viewer 就没有 Entity API 了。

接下来是跟随 Viewer 每帧更新，DataSourceDisplay 也随之更新，连带着所有 DataSource（无论是默认的，还是容器中的）的 Visualizer 也更新。

接下来要展开 Visualizer ~ Updater ~ Batch ~ Primitive 的路线了



现在的 CesiumJS，关于 Entity 中的参数几何类型，全部收拢到 GeometryVisualizer 了。以 GeometryVisualizer 为例。

GeometryVisualizer 更新方法执行时，会取三类 `Entity`（`_addedObjects/_removedObjects/_changedObjects`）对应的 Updater 集，将这些带着诞生 Primitive 使命的 Updater 们进行 **并批** 操作，也就是执行 Visualizer 上的 `_insertUpdaterIntoBatch()` 方法，将 Updater 分类。

以最简单的 `StaticGeometryColorBatch` 分类为例。Visualizer 的 `_insertUpdaterIntoBatch()` 方法主要是把 Updater `add` 到不同的 Batch 分类容器中。

我们看看 `StaticGeometryColorBatch` 做了什么：

- 创建 `GeometryInstance`
- 先把传入的 Updater 分给内置的 `Batch` 容器对象
- 然后创建新的内置 `Batch` 对象，将 Updater 和 `GeometryInstance` 传入，把这个内置的 `Batch` 推入 `StaticGeometryColorBatch` 容器

此时，`StaticGeometryColorBatch` 容器的添加动作就完成了。代码作用域又回到 `GeometryVisualizer` 的更新方法中。

既然分批完成，那么就要更新各个分批了：

``` js
let isUpdated = true;
const batches = this._batches;
const length = batches.length;
for (i = 0; i < length; i++) {
  isUpdated = batches[i].update(time) && isUpdated;
}
```

执行的是各个分批容器的更新方法。

分批容器仍以 `StaticGeometryColorBatch` 为例，它会做两道更新，初值更新以及移动后更新，但是更新的控制权都是交给模块内的 `updateItems()` 函数。

`updateItems()` 函数比较短，函数后段的循环体遍历的是 `StaticGeometryColorBatch` 的某个内置 `Batch` 数组，叫做 `items`（作为传参传入），循环体内调用内置 `Batch` 对象的 `update()` 方法，这个时候，终于看到一个硕大的 `if` 判断来决定是否创建新的 Primitive 了：

``` js
// StaticGeometryColorBatch.js 模块中的 Batch 类的 update 方法

let primitive = this.primitive;
const primitives = this.primitives;

if (this.createPrimitive) {
  const geometries = this.geometry.values;
  const geometriesLength = geometries.length;
  if (geometriesLength > 0) {
    // ... 判断是否存在 primitive，没有才创建
    primitive = new Primitive({
      /* ... */
    });
    primitives.add(primitive);
    isUpdated = false;
  }
} else if (/* ... */) {
  
} // ...
```

此处的 `primitives` 是 `StaticGeometryColorBatch.js` 模块内的 `Batch` 类的成员，`PrimitiveCollection` 类型。它怎么来的呢？

```
// 初始化时
[Module DataSourceDisplay.js]
- new DataSourceDisplay() // HERE!! new PrimitiveCollection()
  - new CustomDataSource() // <- 绑定到
  - DataSourceDisplay.prototype._onDataSourceAdded()
    - DataSourceDisplay.defaultVisualizersCallback()
    [Module GeometryVisualizer.js]
    - new GeometryVisualizer() // <- 传入
      - new StaticGeometryColorBatch() // <- 传入
  
// 更新时
[Module GeometryVisualizer.js]
- Visualizer.prototype._insertUpdaterIntoBatch()
  [Module StaticGeometryColorBatch.js]
  - fn StaticGeometryColorBatch.prototype.add
    - new Batch() // <- 传入
```

追代码，才发现是 `DataSourceDisplay` 实例化时自己创建了一个 `PrimitiveCollection`，并分发给了 `defaultDataSource`，也就是我们访问 `viewer.entities` 时那个 `CustomDataSource`。

关于渲染

所有的 Primitive 渲染都是 Scene 渲染一帧的流程完成的，当创建 DataSourceDisplay 时，DataSourceDisplay 会创建一个属于自己的 PrimitiveCollection，立马就会添加到 Scene 对象的 PrimitiveCollection 中（没错，PrimitiveCollection 可以自嵌套），也就能参与 Scene 的帧渲染过程了。