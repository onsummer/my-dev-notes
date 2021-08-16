# 1 Model

asp.net + entityframework 中关于数据表（或 nosql 中的文档）的类描述，每个数据列（或文档字段）等价类中的 Property。

习惯性放在 project 下的 `Models` 目录里。

下面即一个简单的 model：

``` c#
public class AddressModel {
  public string AddressName { get; set; }
  public string Telephone { get; set; }
}
```

# 2 Controller

控制器，`MVC` 中的 C，负责封装对 Model 的访问。

一个 Controller 通俗点说对应一个路由终点，例如有接口： `localhost:3880/SomeController`

一个 aspnet 的控制器，具备以下几个特征：

- 继承自 `Microsoft.AspNetCore.Mvc.ControllerBase` 类
- 贴有 `ApiControllerAttribute` 或 `ControllerAttribute`
- 通常用 `RouteAttribute` 指定路由



# 3 EntityFrameworkCore.DbContext

一个数据库上下文基类，通常要自己继承它并实现具体的业务类。

它可以粗暴理解为一个数据库。

- 成员属性是 `DbSet<T>` 类型，代表一个数据表。T 即 `Model`
- 需要重写生命周期函数 `OnConfiguring` 和 `OnModelCreating`
- `OnModelCreating` 函数里接收一个 `EntityFrameworkCore.ModelBuilder` 类型的参数，用：
  - `HasPostgresExtension(string extName)` 方法检查扩展
  - `Entity<T>(Action<T> callback)` 检查数据表，T是 `Model`，callback 是一个委托，允许在里面对委托参数（即一行数据）检查记录行
    - 使用 `ToTable` 方法切换模式和表
    - 使用 `Property` 选择数据列，接受一个 Func 委托，委托参数是 Model
    - 使用 `HasMaxLength` 方法检查列最大长度
    - 使用 `HasColumnName` 检查有无某一列
    - 使用 `HasComment` 检查注释
    - ...

数据库上下文类的实例，会在 `Controller` 成为一个私有成员（通过构造函数传入），而后在具体的 Http 请求方法中，就可以用这个上下文变量的具体 Model 实例（`DbSet` 类型的属性）去操作数据表了。



# 4 Startup

在 `ConfigureServices` 方法中要配置 aspnet 服务