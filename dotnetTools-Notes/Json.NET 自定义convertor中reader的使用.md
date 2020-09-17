JsonReader的属性



# 1. Path & Value

path就是当前json的路径，例如json是这样的：

``` JSON
{
    "A": [
        {
            "B":12
        }
    ]
}
```

那么12这个数字的 Path 就是 `A[0].B`

12即value

但是当reader读的是键名时，value也是键名，而且ValueType属性是 String

# 2. QuoteChar

指示解析字符串时用双引号还是单引号，默认双引号

如果是 ASCII 码 `0` 那就说明当前没有解析到值

# 3. Depth

当前json的深度

# 4. FloatParseHandling

指示遇到数字时用double还是demical解析

# 5. TokenType

枚举值，指示当前 path 的 json 是什么位置，有如下几种：

``` C#
public enum JsonToken
{
    None,
    StartObject, // {
    StartArray, // [
    StartConstructor, // ？
    PropertyName, // 键名
    Comment, // 注释
    Raw, // ？
    Integer, // int数字
    Float, // float数字
    String, // ""
    Boolean, // false true
    Null, // null
    Undefined, // 
    EndObject, // }
    EndArray, // ]
    EndConstructor, // ？
    Date, //
    Bytes // 
}
```

比如，当Path是键名时，TokenType就是PropertyName

# 6. State

与 TokenType 类似，枚举值

``` C#
protected internal enum State{
    Start,
    Complete,
    Property,
    ObjectStart,
    Object,
    ArrayStart,
    Array,
    Closed,
    PostValue,
    ConstructorStart,
    Constructor,
    Error,
    Finished
}
```

暂不明

# 7. 