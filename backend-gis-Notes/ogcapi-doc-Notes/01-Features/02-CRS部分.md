# API规范



## ① 参数 `crs` - 请求特定坐标系的数据

```http
GET {baseUrl}/collections/buildings/items/1?crs=http://www.opengis.net/def/crs/EPSG/0/3395
```

crs 的默认值是 `http://www.opengis.net/def/crs/OGC/1.3/CRS84`（无大地高）和 `http://www.opengis.net/def/crs/OGC/0/CRS84h`（有大地高）



## ② 参数 `bbox&bbox-crs` - 请求特定范围的数据

``` http
GET {baseUrl}/collections/buildings/items?bbox=280375,5577680,531792,5820212&bbox-crs=http://www.opengis.net/def/crs/EPSG/0/25832
```



...（未完）