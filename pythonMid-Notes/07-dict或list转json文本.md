# dict 转 json字符串：dumps()

使用到 `json` 包

```python
import json
dict_source = {
  'name': 'Apple',
  'size': 1
}
jsonstr = json.dumps(d)
```



# json 字符串转 dict：loads()

```python
import json
# 使用上例的 jsonstr 变量
dict_back = json.loads(jsonstr)
```



# load() 与 dump()：直接到文件

与前面两例比较就是函数名少了个 `s`（猜就是 string 的意思）

## dump()

```python
import json
with open('result.json', 'w') as f_handle:
  json.dump(dict_source, f_handle)
```

## load()

```python
import json
with open('result.json', 'r') as f_handle:
  dict_back = json.load(fp = f_handle) # 返回一个 dict 变量
```



# 二进制字符串与字符串互转

```python
normalstr = '123'
# 转二进制，两种方法
bin_string = bytes(normalstr, encoding = 'utf8') # type(bin_string) -> <class 'bytes'>
bin_string2 = str.encode(normalstr) # type(bin_string2) -> <class 'bytes'>
```

从二进制字符串转普通字符串

```python
bstring = b'123'
# 转普通字符串，两种方法
normalstring1 = str(bstring, encoding = 'utf-8') # type(normalstring1) -> <class 'str'>
normalstring2 = bstring.decode('utf-8') # type(normalstring2) -> <class 'str'>
```

