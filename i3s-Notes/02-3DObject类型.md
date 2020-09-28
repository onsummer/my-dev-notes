3DObject 类型来自精模、白模和 gdb 中的 Multipatch。

它的主要特征是，无 sublayers。

# 1. 示例 3dSceneLayer.json

见 [3DObject.3dSceneLayer.json](./attachments/Sample3DObject.3dSceneLayer.json)

其定义文档是：[https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md)

注意，3DObject 和 IntegratedMesh 类型的图层，在1.7规范中，其 root Node 是不存在几何数据的。

一个这样的图层，是由一棵由 node 组成的树组织起来的。node，是i3s中的一个基本单位，可以理解为瓦片。

# 2. JSON定义解析

## 2.1. 顶级属性

列表

| 属性名           | json类型                           | 描述                                                         |
| ---------------- | ---------------------------------- | ------------------------------------------------------------ |
| **id**           | 整数                               | 此图层的唯一id                                               |
| **layerType**    | 字符串                             | 标识此图层的类型，只能是 `3DObject` 和 `IntegratedMesh`      |
| **version**      | 字符串                             | 在此图层所有资源更新完毕的网络会话结束后留下的id，通常是uuid |
| **capabilities** | 字符串数组                         | 这个图层支持的各项功能，可选项有：`View`、`Query`、`Edit`    |
| **store**        | [store](./Schema1.7/store.md) 对象 | 此对象描述了该图层各种数据的物理存储结构。                   |

以上为必选属性，以下为可选属性

| 属性名                 | json类型                          | 描述                                 |
| ---------------------- | --------------------------------- | ------------------------------------ |
| href                   | 字符串                            | 一个相对路径                         |
| spatialReference       | [spatialReference]() 对象         | 坐标系统的 WKID                      |
| heightModelInfo        | [heightModelInfo]() 对象          | 高程模型信息                         |
| name                   | 字符串                            | 图层名称                             |
| serviceUpdateTimeStamp | [serviceUpdateTimeStamp]() 对象   | 服务最后更新的时间戳                 |
| alias                  | 字符串                            | 图层别名                             |
| description            | 字符串                            | 图层描述                             |
| copyrightText          | 字符串                            | 版权信息                             |
| ZFactor                | 数字                              | 高程缩放因子                         |
| disablePopup           | 布尔                              | 指示是否有弹窗                       |
| cachedDrawingInfo      | [cachedDrawingInfo]() 对象        | ？（我也不太清楚）                   |
| drawingInfo            | [drawingInfo]() 对象              | 绘制信息，例如默认的线框色等         |
| elevationInfo          | [elevationInfo]() 对象            | ？（我也不太清楚，应该是高程相关的） |
| popupInfo              | [popupInfo]() 对象                | 弹窗信息                             |
| fields                 | [field]() 对象数组                |                                      |
| attributeStorageInfo   | [attributeStorageInfo]() 对象数组 | 属性数据文件的存储结构信息           |
| statisticsInfo         | [statisticsInfo]() 对象数组       |                                      |
| nodePages              | [nodePageDefinition]() 对象       |                                      |
| materialDefinitions    | [materialDefinition]() 对象数组   |                                      |
| textureSetDefinitions  | [textureSetDefinition]() 对象数组 |                                      |
| geometryDefinitions    | [geometryDefinition]() 对象数组   |                                      |

# 3. geometryDefinitions

这是一个数组，每一个 definition 代表了一种几何数据的存储结构。

一个 3dSceneLayer 允许 node 之间的几何数据二进制存储结构不同。

由 node 对象的 mesh.geometry.definition 属性引用。

# 4. materialDefinitions

这是一个数组，每一个 definition 代表了一种材质定义。

由 node 对象的 mesh.material.definition 属性引用。