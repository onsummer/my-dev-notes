

# API 规范

## ① 获取服务的功能信息

### GET `/` 接口

`/` 接口返回的是登陆页面信息，返回的 JSON 含三个属性：

- `title: string`
- `description: string`
- `links: Link[]`

其中，`Link` 



### GET `/conformance` 接口

`/conformance` 接口返回该服务器的一致性规定标准



### GET `/collections` 接口

`/collections` 接口返回全部矢量要素数据容器信息



### GET `/collections/:collectionId` 接口

查询特定 id 的矢量要素数据容器的信息



### PATCH `/collections/:collectionId` 接口

更新特定 id 的矢量要素数据容器的信息



### GET `/collections/:collectionId/queryables` 接口

查询特定 id 的矢量要素数据容器中可被查询的属性信息



## ② 操作要素

### GET `/collections/:collectionId/items` 接口

查询特定 id 的矢量要素数据容器中的所有要素共有的信息



### GET `/collections/:collectionId/items/:featureId`

查询特定 id 的矢量要素数据容器中特定 id 的要素信息