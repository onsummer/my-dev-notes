dotnet core 3.1 控制台 + WebAPI 最小运行示例代码

创建两个csproj，一个是 .NET Core 3.1 控制台项目，一个是 ASP.NET Core Web应用 WebAPI项目，分别命名为 TestConsole 和 TestAPI

给后者添加一个 Controller，命名为 HelloController，添加一个返回值为 string 的Get 方法：

``` C#
[HttpGet]
public string Get()
{
    return "Hello World!";
}
```

在控制台项目的主函数里，调用WebAPI的主函数：

``` C#
TestAPI.Main();
```

运行core的exe，然后浏览器输入地址：

```
http://localhost:5000/api/hello
```

屏幕即返回 “Hello World!” 字样。