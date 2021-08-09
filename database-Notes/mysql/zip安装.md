压缩包版安装

假设解压至 `D:\database\mysql\mysql-8.0`

```
D:\database\mysql\mysql-8.0\
 +bin\
 +docs\
 +include\
 +lib\
 +share\
 -LICENSE
 -README
```



# 1 选项文件

如果你安装的位置和数据目录不是默认位置 `C:\Program Files\MySQL\MySQL Server 8.0` and `C:\Program Files\MySQL\MySQL Server 8.0\data`，并且需要在启动时修改一些选项，那最好自己写一个选项文件。

选项文件会在下列目录中寻找：

| 文件名                                 | 期望作用                                                     |
| :------------------------------------- | :----------------------------------------------------------- |
| `%WINDIR%\my.ini`, `%WINDIR%\my.cnf`   | 全局配置                                                     |
| `C:\my.ini`, `C:\my.cnf`               | 全局配置                                                     |
| `%BASEDIR%\my.ini`, `%BASEDIR%\my.cnf` | 全局配置                                                     |
| `defaults-extra-file`                  | 如果有用到 [`--defaults-extra-file`](https://dev.mysql.com/doc/refman/8.0/en/option-file-options.html#option_general_defaults-extra-file) 指定额外文件 |
| `%APPDATA%\MySQL\.mylogin.cnf`         | （仅客户端）登录路径配置                                     |
| `%DATADIR%\mysqld-auto.cnf`            | （看不懂，暂时不翻译）                                       |

其中，`%BASEDIR%` 是 mysql 的安装目录。`%DATADIR%` 是 mysql 的数据目录，用于寻找其内的 mysqld-auto.cnd 文件。

一份常规的全局配置文件如下所示：

``` ini
[client]
port=9877
default-character-set=utf8

[mysql]
default-character-set=utf8

[mysqld]
port=9877
basedir=D:\\databases\\mysql\\mysql-8.0.26
datadir=D:\\databases\\mysql\\mysql-8.0.26-data
max_connections=20
max_connect_errors=10
character-set-server=utf8
default-storage-engine=INNODB
key_buffer_size=16M
max_allowed_packet=128M

[mysqldump]
quick
```

既然是选项文件，那么上面的选项其实都可以去掉。

## Windows 目录斜杠问题

假设你要布设的 mysql 基本目录是 `C:\Program Files\MySQL\MySQL Server 8.0`，那么 basedir 下面四种写法都是可以的

``` ini
basedir="C:\Program Files\MySQL\MySQL Server 8.0"
basedir="C:\\Program Files\\MySQL\\MySQL Server 8.0"
basedir="C:/Program Files/MySQL/MySQL Server 8.0"
basedir=C:\\Program\sFiles\\MySQL\\MySQL\sServer\s8.0
```

注意引号。

## 权限

必须有对选项文件的访问权。

---

我就直接放在 `D:\database\mysql\mysql-8.0\my.ini` 了。

# 2 初始化数据目录

如果你用的是 zip 安装法，数据目录是没有包含在 zip 里的，要自己手动创建。

这是必须做的一步，就是使用可执行程序初始化数据目录。

在这之前，你得把 1 中的选项文件搞好。

> **身份验证在 v8.0 改变了**
>
> 默认身份验证插件在 8.x 中从 `mysql_native_password` 改为 `caching_sha2_password`，root 账户也随之改为这个新的插件。

> 如果是 linux / 类unix 系统，要创建一个 mysql 账户和组。然后以此账户登录进行操作。

命令行切换到安装目录，通常 linux 会安装到 `/usr/local/mysql` 之类的地方。我的是 `D:\database\mysql\mysql-8.0`

## 使用 .\bin\mysqld.exe 初始化

``` shell
.\bin\mysqld.exe --initialize --console
```

如果是 linux 一定要注意数据目录的可访问性，其他信息参考官方文档。

`--console` 表示在 Windows 系统中，初始化的信息会打在控制台界面，方便查看临时密码。

> 显式指定配置文件的参数举例：`--defaults-file=C:\my.ini`

## 初始化过程可能会有的问题参考

- 目录没有就帮你创建，但是如果有就会检查是否非空，非空会报错 `[ERROR] --initialize specified but the data directory exists. Aborting.` （例外情况是目录下每个文件夹、文件的名称都以 . 开头）

- 创建 mysql 本身所需的系统数据表、模式。

- 创建 root 账户和保留账户。

  - 如果是 `--initialize` 则生成随机密码，写控制台：

    ```
    [Warning] A temporary password is generated for root@localhost:
    iTag*AfrH5ej
    ```

  - 如果是 `--initialize-insecure`，则会写控制台说创建了一个空密码

- 其他操作。然后退出初始化

## 初始化后立即更改密码

请先启动 mysql，见 3 或 4.

### 如果用了 `--initialize`

输入

``` shell
.\bin\mysql.exe -u root -p
```

然后输入系统生成的随机密码。如果不知道随机密码，看系统错误日志即可。

### 如果使用了 `--initialize-insecure`

输入

``` shell
.\bin\mysql.exe -u root --skip-password
```

可以直接登录。

### 立即改 root 账户的密码

``` sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root-password';
```

# 3 命令式启动 mysql

```shell
.\bin\mysqld.exe --console
```

完成启动后，你会在控制台看到这样的消息：

```
mysqld: ready for connections
Version: '8.0.26'  socket: ''  port: xxxx
```

然后打开新的控制台连接数据库即可。

## 停止服务器

``` shell
.\bin\mysqladmin -u root shutdown
```

如果 root 账户有密码，要这样写

``` shell
.\bin\mysqladmin -u root -p shutdown
```

会让你输入密码。

日志文件在数据目录下以 `err` 结尾的文件中。

# 4 Windows 服务安装 mysql

命令很简单

``` shell
.\bin\mysqld.exe --install [可选的服务名，英文]
```

但是要确保服务停下来了。参考第 3 节里的 shutdown 命令

## 移除服务

``` shell
C:\> SC DELETE [服务名，默认 mysql]
```

也可以用

``` shell
.\bin\mysqld.exe --remove
```



# 5 多实例启动 mysql

参考：https://dev.mysql.com/doc/refman/8.0/en/multiple-windows-services.html

