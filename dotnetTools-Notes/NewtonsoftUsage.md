Newtonsoft.JSON 常用经验

# 1 文件交互

## 1.1 读取 JSON 文件

### 1.1.1 从文件中读取

``` C#
public static byte[] JsonFileToBytes(string path)
{
    JObject jObject;
    using (var textStreamReader = System.IO.File.OpenText(path))
    {
        using (var jsonTextReader = new JsonTextReader(textStreamReader))
        {
            jObject = JToken.ReadFrom(jsonTextReader) as JObject;
        }
    }
    return jObject;
}
```



### 1.1.2 从字符串中生成

``` c#
public static JObject LoadJsonFromText(string jsonStr)
{
    return JObject.Parse(jsonStr); // 或者返回 JToken： return JToken.Parse(jsonStr);
}

// 另一种方法
public static JObject LoadJsonFromText(string jsonStr)
{
    return JsonConvert.DeserializeObject(jsonStr) as JObject; // 或者 as JToken
}
```



### 1.1.3 从流中生成

``` C#
using (var streamReader = new System.IO.StreamReader(filePath)) 
{
    using (var jsonTextReader = new JsonTextReader(streamReader))
    {
        jObject = ... // 与文件中读取的 exam. 一样
    }
}

```

其实与从文件中读取是一样的



## 1.2 存成 JSON 文件

### 1.2.1 `JObject` 转 `string`

``` C#
string jsonStr = JsonConvert.SerializeObject(jObject); // 主要就是 JsonConvert.SerializeObject() 方法的使用

// 另一种方法
string jsonStr = jObject.ToString();
```

其实，`JToken`、`JArray`、`JProperty`、`JObject` 应该都能调用其 `ToString()` 方法返回字符串（未测试）。



### 1.2.1 `string` 存文件

``` C#
System.IO.File.WriteAllText(jsonStr);
```

用 `StreamWriter` 的标准写法也可以。

``` C#
var sr = new StreamReader(fullPath, System.Text.Encoding.UTF8);
string jsonStr = sr.ReadToEnd();
sr.Close();
// ...
```





### 1.2.2 `string`转字节`(byte)`

```C#
public static byte[] TextToBytes(string jsonStr)
{
	return Encoding.Default.GetBytes(jsonStr);
}
```



# 插入：`JToken`、`JObject`、`JProperty`、`JArray`、`JValue`概念区分

## ① `JToken`

`JToken` 是 `JObject`、`JProperty`、`JArray`、`JValue`的抽象，是一个父级类。

``` 
JToken 　　　　　　　 -抽象基类
　　└ JContainer 　　　 - 能够包含其它JToken的JToken抽象基类
　　　　├ JArray 　　　　- 表示一个JSON数组（包含一个有序的List）
　　　　├ JObject 　　 - 表示一个JSON对象（包含一个IEnumerable）
　　　　├ JProperty　　 - 表示一个JSON属性（在JObject中是一个name/JToken键值对）
　　└ JValue　　　　　　 - 表示一个原生JSON值（string,number,boolean,null) 
```

如果不知道获取的 JSON 对象是什么东西，就用JToken，然后你可以检查它的Type属性来决定是哪种类型的token，并把它转化成相应的类型。

## ② `JObject `、`JArray`、`JProperty`、`JValue`

JObject 代表 JSON 中的一个 大括号对象

JArray 代表 JSON 中的一个 中括号对象

JProperty 代表 JSON 中的一个完整的 键值对，值是 JValue



# 3 创建JSON对象

使用 JObject 类：

``` C#
// 遍历 JObject
JObject state = (JObject)obj["skins"];  //获取skins里的数据

foreach (JToken item in state.Values()) { }

foreach (JProperty item in state.Properties()) { }

JToken tok = state[pkey];
if (tok.HasValues) { }

foreach (JProperty jp in tok) { }

// 创建 JObject
JObject json = new JObject { { "name", "steam" }, { "age", 18 } };
JArray json2 = new JArray { 
    new JObject { "name", "basketball" },
};
json2.Add(new JProperty("name", "football"));
json.Add("habbits", json2);
Console.Write(json);

/* 
输出结果：
 
{
	"name": "steam",
    "age": 18,
    "habbits": [
    	{ "name", "basketball" },
        { "name", "football" }  	
    ]
}
        
*/
```

创建json主要是用 JObject、JArray、JProperty和JValue



# 4 索引JSON

## ① 遍历 `JObject`

``` C#
foreach (KeyValuePair<string, JToken> item in jObject)
{
	Console.Write(item.Key, item.Value.ToString());
}
```

## ② 遍历 `JToken`

``` C#
foreach (JToken item in jToken)
{
	// ...
}
```

## ③ 遍历 `JArray`

``` C#
foreach (JToken item in jArray)
{
	// ...
}
```

## ④ `JObject` 常用属性、方法

- `bool JObject.ContainsKey(string propertyName)`

- `int JObject.Count`
- `JToken JObject.GetValue(string propertyName)`
- `bool JObject.HasValues`
- `JObject.Merge(object content)`
- `JProperty JObject.Property(string name)`
- `JObject.Replace(JToken value)`
- `bool JObject.Remove(string propertyName)`
- `JTokenType JObject.Type`
- `T JObject.Value<T>(object key)`
- `JObject.Add(JToken item)`

其实绝大多数方法都是继承自 `JToken` 类和 `JContainer` 类的。

## ⑤ `JArray` 常用属性、方法

- `void JArray.Clear()`
- `void JArray.CopyTo(JToken[] array, int startIndex)`
- `void JArray.Insert(int index, JToken item)`
- `void JArray.IndexOf(JToken item)`

转数组的方法：

有数据如下：

```JSON
// JArray 为
[1, 2, 3]
```

`JArray.ToObject<float[]>()` 或者 `JToken.ToObject<float[]>()`

## ⑥ `JProperty` 常用属性方法

实例化：

``` C#
var jProperty = new JProperty("name","jack");
/*
  "name" : "jack"
*/
var jProperty2 = new JProperty("name", 1, 2, 3); 
/*
  "name" : [ 1, 2, 3 ]
*/
```

构造函数的签名是：

``` C#
JProperty(string name, object content)
JProperty(string name, params object[] contents)
```

`JProperty` 作为一个 JSON 中的 “键值对”，有它特有的属性：

``` C#
JProperty.Name // string
JProperty.Value // JToken
```

## ⑦ `JToken` 常用属性、方法

除了上面 `JObject`、`JArray`等继承到的属性、方法外，如果不知道获取的对象是什么类型的，可以通过查看 `JToken.Type` 属性来判断是什么类型的。

`JToken.Type` 是 ` JTokenType` 类型的，是一个枚举类型：

``` C#
public enum JTokenType
{
    None = 0,
    Object = 1,
    Array = 2,
    Constructor = 3,
    Property = 4,
    Comment = 5,
    Integer = 6,
    Float = 7,
    String = 8,
    Boolean = 9,
    Null = 10,
    Undefined = 11,
    Date = 12,
    Raw = 13,
    Bytes = 14,
    Guid = 15,
    Uri = 16,
    TimeSpan = 17
}
```

其实常用到的可能就那几个，例如Integer、Array、Object、None、Null、Undefined等。

# 参考资料

https://www.cnblogs.com/klsw/p/5904573.html