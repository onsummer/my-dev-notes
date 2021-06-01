navicat 的命令列界面无法使用 `psql` 的命令，例如：

``` sh
\dx
```

列出数据库的扩展，会报语法错误，这个时候只能通过 sql 查询进行：

``` sql
select * from pg_extensions;
```

