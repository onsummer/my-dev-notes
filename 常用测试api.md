# 1. 网易云音乐热评

```
https://api.uomg.com/api/comments.163?format=text
https://api.uomg.com/api/comments.163?format=json
```

返回参数说明：

| 名称    | 类型   | 说明               |
| :------ | :----- | :----------------- |
| code    | string | 返回的状态码       |
| content | string | 返回文本信息       |
| msg     | string | 返回错误提示信息！ |

返回示例

``` json
{
  "code": 1,
  "data": {
    "name": "Fade",
    "url": "http://music.163.com/song/media/outer/url?id=29947420.mp3",
    "picurl": "http://p3.music.126.net/6Skxbgl8cfIjFGV-MzGi0Q==/109951163787691327.jpg",
    "artistsname": "Alan Walker",
    "avatarurl": "https://p1.music.126.net/1nY-8x6rObBnfqE6gYWKZA==/1424967077706667.jpg",
    "nickname": "我叫李朋啊",
    "content": "结婚准备强行用这首[大哭]"
  }
}
```



# 2. 随机土味情话

``` 
https://api.uomg.com/api/rand.qinghua?format=json
https://api.uomg.com/api/rand.qinghua?format=text
https://api.uomg.com/api/rand.qinghua?format=js
```

返回参数说明：

| 名称    | 类型   | 说明               |
| :------ | :----- | :----------------- |
| code    | string | 返回的状态码       |
| content | string | 返回文本信息       |
| msg     | string | 返回错误提示信息！ |

返回示例：

```json
{
  "code": 1,
  "imgurl": "https:\/\/ws2.sinaimg.cn\/large\/005zWjpngy1fuvgjtiihyj31400p0ajp.jpg"
}
```



# 3. 历史上的今天

``` 
https://api.oioweb.cn/api/lishi.php
```

# 4. 土味情话/污话/毒鸡汤

``` 
// 土味情话、污话
https://api.oioweb.cn/api/saohua.php

// 毒鸡汤
https://api.oioweb.cn/api/binduyan.php
```

# 5. 实时电影排名

``` 
https://api.vvhan.com/api/movies
```

# 6. 获取当前浏览器、系统信息

``` 
https://api.vvhan.com/api/visitor.info
```

