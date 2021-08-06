# 1 变量 - variable

变量就代表有多少个数据

## 属性 - attribute

每个变量除了数据本体之外，还有描述这个变量的信息，这些信息就叫做属性

# 2 维度 - dimensions

每个变量有多少个元素组成



# JSON 表示一个变量

``` json
[
  {
    // 变量名
    "name": "ocean_time",
    // 数值类型
    "componentType": "double",
    // 属性
    "attrs": {
      "long_name": "averaged time since initialization",
      "units": "seconds since 1994-01-01",
      "field": "time, scalar, series",
      "calendar": "proleptic_gregorian"
    },
    // 数据本体
    "datas": [], // 长度应为下面这个数组的元素的乘积，索引方程是 f(d1, d2, d3, d4) = datas[d1*d2*d3*d4]
    "dims": [
      {
        "name": "ocean_time",
        "size": 1,
      },
      {
        "name": "s_rho",
        "size": 30,
      },
      {
        "name": "eta_rho",
        "size": 181,
      },
      {
        "name": "xi_rho",
        "size": 193
      }
    ]
  }
]
```

