``` nginx
location ^~ /A {
  root /home/ccc;
}
```

你访问 `/A/1.jpg`，

实际上对应磁盘路径是 `/home/ccc/A/1.jpg`

> **root** 会原封不动地贴到后面去
>
> 注意这里后面都没有斜杠





----

``` nginx
location ^~ /A {
  alias /home/ccc;
}
```

你访问 `/A/1.jpg`，
实际上程序帮你访问的是`/home/ccc/1.jpg`

>**alias** 只会把location后面的贴到后面去
>
>注意这里也都没有斜杠