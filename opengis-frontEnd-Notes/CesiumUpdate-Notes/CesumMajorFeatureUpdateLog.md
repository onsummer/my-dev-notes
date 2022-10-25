# Ver a0(alpha-0)

2011 年 6 月版本，内测第一个版本



# Ver b0(beta-0)

2011 年 8 月底版本，测试第一版



# Ver b7 - 使用 when.js

2012 年 8 月版本

`Chain` 被 when.js 替换来实现 Promises A 规范。



# Ver b8 - Fabric

2012 年 9 月版本

- Fabric 材质规范发布，由多个 Material 类集中为一个 Material 类

- GLSL 着色器变量前缀 `agi_` 改为 `czm_`



# Ver b10 - WMS

2012 年 11 月版本

- 添加 `WebMapServiceImageryProvider`



# Ver b11 - TMS 和解决 WebGL 精度不足

2012 年 12 月版本

- 添加 `TileMapServiceImageryProvider`

- 添加 `EncodedCartesian3` API

- 添加 `czm_frameNumber` 等一系列重要 GLSL 常量

- 添加水材质

- 添加 `SkyBox`



# Ver b14 - 地形

2013 年 3 月版本

添加 `CesiumTerrainProvider` 和 `ArcGisImageServerTerrainProvider`



# Ver b15

2013 年 4 月版本

添加 `TileCoordinatesImageryProvider` 方便调试查看瓦片行列号



# Ver b19 - GeometryAPI 和 AppearanceAPI

2013 年 8 月版本

增加 `Geometry` API 和 `Appearance` API，参考 [PullRequest 911](https://github.com/CesiumGS/cesium/pull/911)



# Ver b20 - createGeometry

2013 年 9 月版本

`Geometry` API 不再从构造器生成顶点、索引，使用对应几何类的 `createGeometry` 方法代替。



# Ver b21 - EXT_frag_depth

2013 年 10 月版本

支持 WebGL EXT_frag_depth 扩展。



# Ver b26 - Model API 和 ES5 Property

2014 年 3 月版本

- 使用 ES5 Property （getter/setter）代替 get 方法和 set 方法

- 增加 Model API 以支持 glTF 3D 模型绘制，参考 [tutorial](http://cesiumjs.org/2014/03/03/Cesium-3D-Models-Tutorial/)



# Ver b27 - 继续替换 ES5 Property

2014 年 4 月版本

如题。



# Ver b28 - Globe API

2014 年 5 月版本

- 升格 `Scene.primitives.centralBody` 为 `Scene.globe`，也即 Globe API

- 为 Model API 增加 `ModelMaterial` 等 API 以便修改 glTF 材质



# Ver b30 - 需要 NodeJS 辅助构建

2014 年 7 月版本

- 支持 IE 11.0.9

- 为打包版本的 Cesium.js 添加 `VERSION` 常量

- 使用 Node.js 作为开发服务器（使用 Express.js 框架）

这是 beta 的最后一个版本，为 1.0 做准备，最后两个 beta 版本对 API 的调整比较大。



# Ver 1.0 - glTF 0.8 和 无限影像图层

2014 年 8 月版本

- 调整了 glTF 的接口，以支持 0.8 版本的 glTF 数据

- 不再限制影像图层数量



# Ver 1.1 - WMTS

2014 年 9 月版本

- 使用新的 `WebMapTileServiceImageryProvider` 支持 WMTS 1.0.0



# Ver 1.2 - 支持在 IIS 上部署

2014 年 10 月版本

增加 `web.config` 文件，以简易支持 IIS 部署



# Ver 1.6 - Entity API

2015 年 2 月版本

起初，Entity API 是给 Czml 1.0 编写的，后来经过多次重构，变成了现在的 Entity API，使得非图形专业人员也可以编写三维应用。其内部仍旧是 DataSource API。

更多资料参考官方论坛贴子： [Cesium in 2015 - Entity API - CesiumJS - Cesium Community](https://community.cesium.com/t/cesium-in-2015-entity-api/1863)



# Ver 1.10 - glb 雏形、PointPrimitive、RTC 以及 buildModuleUrl

2015 年 6 月版本

- 示例数据中用 bgltf 文件替代 gltf 文件。当时 glTF 规范还是 0.8，还没有 glb 格式，Cesium 团队贡献了这个方案，后来 1.0 版本吸纳成为官方扩展，在 2.0 成为正式标准；被称作 `CESIUM_binary_glTF` 扩展

- 使用 `PointPrimitive` 替换 Entity API 中的 point 类型底层实现

- 在 glTF 中支持 `CESIUM_RTC` 扩展

- 添加 `buildModuleUrl.setBaseUrl` 函数，可以替代全局的 `CESIUM_BASE_URL` 变量的功能，即运行时的基路径。



# Ver 1.11 - UrlTemplateImageryProvider

2015 年 7 月版本

- 增加全能模板影像类 `UrlTemplateImageryProvider`，支持 OpenStreetMap, TMS, WMTS, WMS, WMS-C 等各种规格



# Ver 1.12 - MapboxImageryProvider

2015 年 8 月版本

添加对 Mapbox 影像底图的支持



# Ver 1.13 - GroundPrimitive 贴地支持以及移除第三方 es5 补丁

2015 年 9 月版本

为 `CircleGeometry`, `CorridorGeometry`, `EllipseGeometry`, `PolygonGeometry` 和 `RectangleGeometry` 添加贴地支持，使用 `GroundPrimitive` 类。

需要用到 [EXT_frag_depth](https://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/) 扩展，彼时安卓手机支持情况不统一，IE11 不支持。

Entity API 不支持。

对应的，使用 `Scene.groundPrimitives` 而不是 `Scene.primitives`，它有自己的 z 顺序。

另外，移除了 es5-shim 库对 ES5 语法的补丁支持，因为基本上当时已经全部支持了 ES5 语法。



# Ver 1.14 - WebGL 2.0

2015 年 10 月版本

加入 WebGL 2.0。



# Ver 1.15 - 支持 glTF 1.0 以及使用 gulp

2015 年 11 月版本

- 支持 glTF 1.0 草案；同时也支持 [KHR_binary_glTF](https://github.com/KhronosGroup/glTF/tree/master/extensions/Khronos/KHR_binary_glTF) 和 [KHR_materials_common](https://github.com/KhronosGroup/glTF/tree/KHR_materials_common/extensions/Khronos/KHR_materials_common) 两个扩展；标记 `CESIUM_binary_glTF` 这个旧扩展为过期；

- 不再使用 Java 和 ant 开发 CesiumJS，改用 gulp 控制开发流程

- 使用 WebGL 实例化技术降低了 `BillboardCollection` 和 `LabelCollection` 的内存占用



# Ver 1.16 - 支持视频纹理、地形夸张

2015 年 12 月版本

- 现在 `ImageMaterialProperty.image` 可以设置 `HTMLVideoElement`，也可以直接为 Entity 的 material 设置 HTMLVideoElement；`Material` 类的 uniforms 也支持 HTMLVideoElement，就像 HTMLCanvasElement 一样；视频同步机制由 `VideoSynchronizer` 控制；

- 在 `ImageMaterialProperty`、Image 类型的 `Material` 支持透明度控制



# Ver 1.17 - 量化压缩地形

2016 年 1 月版本

- 使用量化技术压缩了地形数据，参考官方资料：[compression](https://cesium.com/blog/2015/12/18/terrain-quantization/)，节约了 40% 的内存



# Ver 1.18 - 移除 glTF 0.8 的 CESIUM_binary_glTF 支持

2016 年 2 月版本

如题。



# Ver 1.23 - 使用 earcut

2016 年 7 月版本

- 改用 earcut 库实现大规模三角化，参考 [PullRequest 3998](https://github.com/CesiumGS/cesium/pull/3998)

- 支持 glTF 1.0 的 WEB3D_quantized_attributes 扩展



# Ver 1.30 - WMS 1.3

2017 年 2 月版本

- 支持了 WMS 1.3 规范

- `ShadowMap` 类私有化



# Ver 1.31 - KTX 纹理支持

2017 年 3 月版本

参考 [PullRequest 4758](https://github.com/CesiumGS/cesium/pull/4758)

- 添加 loadKTX 函数以加载 KTX 纹理文件

- 添加 loadCRN 函数以加载 Crunch Compressed 纹理

- glTF 和影像图层可以使用 KTX 或 CRN 压缩纹理了





# Ver 1.32 - 移除 ArcGisImageServerTerrainProvider

2017 年 4 月版本

- 移除了对 ArcGisImageServerTerrainProvider 的支持





# Ver 1.33 - 升级 FXAA、添加谷歌服务支持

2017 年 5 月版本

- 添加 `GoogleEarthEnterpriseTerrainProvider` 和 `GoogleEarthEnterpriseImageryProvider`

- 升级 FXAA 至 3.11 版本



# Ver 1.35 - 3DTiles 1.0 和粒子系统

2017 年 7 月版本

- 添加对 3DTiles 1.0 的支持，添加了相关例子

- 添加粒子系统和相关例子



# Ver 1.36 - glTF 2.0

2017 年 8 月版本

- 添加 glTF 2.0 规范的支持，譬如 pbr，形变；升级所有 1.0 示例模型到 2.0 规格



# Ver 1.38 - buildApps

2017 年 10 月版本

增加了 `buildApps` 命令，可以构建出性能更好的包内应用（即使用 built 版本的 Cesium）



# Ver 1.41 - 物体裁剪

2018 年 1 月版本

增加了裁剪平面的支持。参考 [PullRequest 5913](https://github.com/CesiumGS/cesium/pull/5913) 和 [PullRequest 5996](https://github.com/CesiumGS/cesium/pull/5996)



# Ver 1.42 - 3DTiles 实验性支持矢量格式与 Resource API

2018 年 2 月版本

- 实验性支持矢量格式的 3DTiles

- `loadArrayBuffer`, `loadBlob`, `loadImage`, `loadJson`, `loadJsonp`, `loadText`, `loadXML` 和 `loadWithXhr` 函数被标记为过期，使用 Resource 类的 fetch 静态函数代替。

- 3DTiles 分级分类的部分支持，有诸多限制，请参考当月更新日志



# Ver 1.43 - Cesium 官方服务 Ion 上线

2018 年 3 月版本

如题。

- STK 格式的地形数据集将在 2018 年 9 月失效，使用新的格式：[Cesium World Terrain](https://cesium.com/blog/2018/03/01/introducing-cesium-world-terrain/)



# Ver 1.44 - Draco 支持

2018 年 4 月版本

- 主要是 glTF 支持了 Draco 顶点压缩扩展

- 移除 1.42 中标记为过时的一堆请求 API，正式改用 Resource API



# Ver 1.45 - 深度缓冲的支持、Bing 服务不再配 key

2018 年 5 月版本

- `ClippingPlaneCollection` 现在使用 `ClippingPlane` 对象，而不是 `Plane` 对象；

- BingMapsImageryProvider 不再是默认的底图，虽然默认的 Ion 底图服务的数据源仍然是 Bing 地图的

- 你需要自己设置 `Cesium.BingMapsApi.defaultKey` 来访问必应服务

- 参考 [PullRequest 5851](https://github.com/CesiumGS/cesium/pull/5851)，改用只有一个截头体（视锥），改进 DrawCall 性能，改进多截头体连接处的伪影显示情况。

- 升级 Draco 至 1.3.0 以支持使用 WebAssembly



# Ver 1.46 - 后处理

2018 年 6 月版本

- 添加后处理框架，内置 Bloom、FXAA、ambientOcclusion 的支持，参考 [PullRequest 5615](https://github.com/CesiumGS/cesium/pull/5615)

- FXAA API 移动到后处理容器中，即 `Scene.postProcessStages.fxaa.enabled`



# Ver 1.48 - 3DTiles 点云 Draco

2018 年 8 月版本

- 3DTiles 点云支持 Draco 压缩扩展

- 正式支持 3DTiles 层级批次属性表，即 3DTILES_batch_table_hierarchy 扩展

- 3DTiles 瓦片对象的 url 属性，即 `content.url` 被标记为过期，请使用 `content.uri` 代替



# Ver 1.50 - glTF 扩展支持

2018 年 10 月版本

增加的扩展是：KHR_materials_unlit、KHR_techniques_webgl、KHR_blend



# Ver 1.54 - WebP 贴图支持

2019 年 2 月版本

- 使用 EXT_texture_webp 扩展支持了 glTF 中的 WebP 格式贴图

- 在 3DTiles 中支持了 Polylines



# Ver 1.62 - 修改 TMS 底图类

2019 年 10 月版本

原本在早期版本移除的 TMS provider，这个版本又加回来了，改叫 `TileMapResourceImageryProvider`，OSM 的叫做 `OpenStreetMapImageryProvider`。



# Ver 1.63 - ESModule

2019 年 11 月版本

- 模块化从 RequireJS 转向 ES6 模块化。

- Label 全面支持 UTF8 编码

- 库文件 `Build/Cesium/Cesium.js` 和 `Build/CesiumUnminified/Cesium.js` 从 iife 格式改为 UMD，以支持 iife、amd、commonjs 三种情况

- WebWorker 文件体积骤降，8384 KB（gzipped 后 2624 KB）至 863 KB（gzipped 后 225 KB）



# Ver 1.66 - 光

2020 年 2 月版本

- 添加 `Light`, `DirectionalLight`, 和 `SunLight` 类



# Ver 1.67 - Entity 支持 3DTiles

2020 年 3 月版本

- 如题。`Entity.tileset`，即 `Cesium3DTilesetGraphics` 用来在 Entity API 中加载 3DTiles。



# Ver 1.68 - SpectorJS 与 sourcemap 支持

2020 年 4 月版本

- 支持使用 SpectorJS 实时修改着色器

- 未压缩版本的 CesiumJS 库支持生成 SourceMap 文件



# Ver 1.70 - TypeScript 增强类型定义与地下模式

2020 年 6 月版本

源码仍然是 JavaScript，只是用 typescript 创建类型定义

- Ion 用户现在可以用内置的 OSM 3DTiles 了

- 这版本开始有内置的 ts 类型定义了，参考官方博客 [CesiumJS Adds Official TypeScript Type Definitions](ttps://cesium.com/blog/2020/06/01/cesiumjs-tsd/)

- Globe 有了透明模式，所以支持了地下空间渲染，在沙盒中有 Globe Transparency、Underground Color、Globe Interior 三个例子。



# Ver 1.73 - 修改 Mapbox 和必应地图访问令牌的接口

2020 年 9 月版本

移除了 `MapboxApi` 和 `BingMapsApi`，使用对应的 `MapboxImageryProvider`、`MapboxStyleImageryProvider`、`BingMapsImageryProvider`、`BingMapsGeocoderService` 来传递令牌。



# Ver 1.79 - 3DTiles 不再支持 url 属性

2021 年 3 月版本

如题。



# Ver 1.83 - KTX2

2021 年 7 月版本

- 不再支持 KTX1 和 CRN 压缩纹理；改支持 KTX2 压缩纹理；移除 `loadCRN` 和`loadKTX` 函数

- 支持 glTF 的 KHR_texture_basisu 扩展，以进一步支持 ktx2 纹理贴图

- 增加动态地形夸张功能

- 增加 glTF 外轮廓线扩展（Cesium 自己研发的）CESIUM_primitive_outline 的支持

- 在文档中强调 Windows 平台上所有浏览器都不支持 outlineWidth 属性



# Ver 1.84 - IE 11 结束使命

2021 年 8 月版本

如题



# Ver 1.87.1 - 实验性支持 3D Tiles Next

2021 年 11 月版本

- 增加 ModelExperimental 架构，默认不启用，更好支持 glTF

- 增加 CustomShader，支持自定义着色器

- 增加 3D Tiles Next 例子



# Ver 1.91 - MSAA

2022 年 3 月版本

- 增加 MSAA 效果（需要手动开启 WebGL2）



# Ver 1.92 - 原生 Promise API

2022 年 4 月版本

如题。



# Ver 1.93 - 大气效果提升

2022 年 5 月版本

如题，给了一个简单的例子



# Ver 1.94 - 影像分割对比

2022 年 6 月版本

移除了 `ImagerySplitPosition` 类和 `Scene.imagerySplitPosition` 属性。使用  `SplitDirection` 类和 `Scene.splitPosition` 属性代替。



# Ver 1.96 - esbuild

2022 年 8 月版本

- 启用 esbuild，加速了构建过程

- 重新编排了构建命令

- 打包之后的库文件应设置 `CESIUM_BASE_URL`，不能用 `buildModuleUrl` 了



# Ver 1.97 - ModelAPI & CustomShaderAPI & 移除 glTF 1.0

2022 年 9 月版本

- ModelExperimental 转正，移除旧版 Model API

- 3D Tiles Next 的几个扩展（将来是 1.1）得到实现

- 移除 CPU 端的实例化绘制

- 不再支持 glTF 1.0

- `ModelMesh` 和 `ModelMaterial` 类被移除

- glTF 的 `KHR_techniques_webgl` 扩展被移除
