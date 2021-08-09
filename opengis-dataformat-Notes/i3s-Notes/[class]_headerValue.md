# headerValue 类

- 是否是 `3dSceneLayer.json` 的顶级属性：否

## 类描述

描述属性二进制文件的头部属性元数据用，关联类：[attributeStorageInfo 类]()

## 示例

``` JSON
{
    "property": "count",
    "valueType": "UInt32"
}
```

## ① [属性] property，必须

node的属性二进制文件的头部字段名，例如 `"count"`，表示的是当前node的二进制属性文件内有多少个属性（与当前node的feature数量的一致的）。（文案待修改）

## ② [属性] valueType，必须

属性值类型（文案待修改）