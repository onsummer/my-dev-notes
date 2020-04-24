# Ft情况1

ftJSON有，ftBinary无

这种情况属于要素表全部写在ftJSON中，表现为

``` JS
B3dm.Header.featureTableJSONByteLength = XX
B3dm.Header.featureTableBinaryByteLength = 0
```

这种情况在构造_ftBinary时，只需给个{}

在ft.toDict()时，_ftBinary返回的是{}

# Ft情况2

ftJSON有，ftBinary有

这种情况属于要素表是JSON头引用二进制数据体，表现为

``` JS
B3dm.Header.featureTableJSONByteLength = XX
B3dm.Header.featureTableBinaryByteLength = YY
```

这种情况在构造_ftBinary时，只需给个{}

# Ft返回字典处理

对于B3dm.Body.toDict()时，需要判断B3dm.Header对应的字节数量来确定返回类型。

对于B3dm.Body.FeatureTable._ftBinary的构造，需要判断B3dm.Header对应的字节数量来构造信息

# Bt情况1

btJSON无，btBinary无

# Bt情况2

btJSON有，btBinary无

# Bt情况3

btJSON有，btBinary有