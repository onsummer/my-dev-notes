本篇为原文 [OGC Web API Guidelines](https://github.com/opengeospatial/OGC-Web-API-Guidelines) 的翻译稿。

---

OGC Web API 开发指南

---

# 0 综述

## 一个全面的 OGC Web API 开发指南

OGC Web API 指南启发自主流 IT 业界的设计原则。包括：

- [ZalandZalando RESTful API and Event Scheme Guidelines](https://opensource.zalando.com/restful-api-guidelines/)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md)
- [Google API Design Guide](https://cloud.google.com/apis/design/)

> 译者注：站在巨人的肩膀上，可以省很多事情。

## 为什么要遵守此设计原则



## 目的与过程



## 出发点



## 如何引用本文



# 1 设计原则

## 原则1 不要重复造轮子



## 原则2 让 API 简单且直观



## 原则3 使用众所周知的资源类型



## 原则4 使用一致的 URIs



## 原则5 使用 RFC7231 标准的 HTTP 请求方法



## 原则6 令选择标准置于 "?" 后面

URL 中，"?" 左边的代表一种资源，"?" 右边代表这种资源中被选择的部分。

例如：

```
.../collections/highways/items?id=A8 => 返回 id 是 A8 的高速路
.../collections/highways/items?id=A8,A9 => 返回 id 是 A8和A9 的高速路
.../collections/highways/items/A8?time=2019-02-12T12:00:00Z => 返回 time 是 2019-02-12T12:00:00Z 的高速路
```



## 原则7 使用 HTTP 状态码来处理错误



## 原则8 使用明确的 HTTP 状态码

HTTP 状态码超过 70 个，只需考虑最常用的几个即可。例如：

| 基本                 | 明细                       |
| -------------------- | -------------------------- |
| - 100 继续           |                            |
| - 200 没问题         | - 201 创建了               |
|                      | - 204 无内容               |
| - 30x 重定向         | - 30x 重定向               |
|                      | - 304 未修改               |
| - 400 错误请求       | - 401 没授权               |
|                      | - 403 禁止                 |
|                      | - 404 没找到               |
|                      | - 405 请求方法不允许       |
|                      | - 406 不可接受             |
|                      | - 409 冲突                 |
|                      | - 410 Gone                 |
|                      | - 412 Precondition Failed  |
|                      | - 415 不支持的 MIME 类型   |
|                      | - 422 Unprocessable Entity |
|                      | - 429 请求过多             |
| - 500 服务器内部错误 | - 503 服务不可用           |



## 原则9 使用 HTTP 请求头



## 原则10 允许内容的灵活性



## 原则11 分页



## 原则12 处理资源



## 原则13 支持元数据



## 原则14 别忘了安全需求



## 原则15 描述API



## 原则16 使用通用的标识符



## 原则17 使用明确的关系



## 原则18 支持 W3C 跨域资源共享



## 原则19 资源编码



## 原则20 良好的 API 一开始就应该可以被测试



## 原则21 指明操作的安全性



## 原则22 令资源可被发现



## 原则23 明确默认行为

