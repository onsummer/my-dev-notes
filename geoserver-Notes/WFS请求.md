# 1 使用浏览器 fetch API

## 1.1 GetCapabilities

### get 请求（queryString）

```js
const serviceParam = 'wfs'
const wfsVersionParam = '1.1.0'
const requestParam = 'GetCapabilities'
const url = `http://localhost:4800/geoserver/ows?service=${serviceParam}&version=${wfsVersionParam}&request=${requestParam}`
fetch(url)
	.then(response => response.text())
	.then(text => console.log(text))
```

### post 请求

```js
const queryXml = `
<GetCapabilities 
	service="WFS"
	xmlns="http://www.opengis.net/wfs"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd" />`
const url = `http://localhost:4800/geoserver/ows`

fetch(url, {
  method: 'POST',
  headers: new Headers({
    'Content-Type': 'text/xml' // 'application/xml' 应该也可以
  }),
  body: queryXml
})
  .then(response => response.text())
	.then(text => console.log(text))
```





# 2 使用 postman

## 2.1 GetCapabilities

### get 请求

同 fetch 中的 get。

### post 请求

在 body 处使用 `raw` 格式，填入 xml 文本，并选择 xml 即可。