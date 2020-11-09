客户端：安装ssh（Windows 10自带OpenSSH）

服务端：安装ssh（Windows Server 2019自带OpenSSH）

---

# 客户端生成公私钥

使用`ssh-keygen.exe`生成公私钥，然后把公钥传递给服务端，写入`~/.ssh/authorized_keys`文件中，作为一行。

三次回车，就生成好了两个文件：

```
id_rsa
id_rsa.pub
```

带pub后缀的是公钥文件，

## 服务端配置

在用户目录下的新建`.ssh`目录（如果不存在）。

然后把客户端公钥文件的内容写入到这个新建的目录下的`authorized_keys`文件内，即可免密登录。

# ssh登录

语法：

``` 
ssh <user>@<ip>
# user是是服务端的用户名
# 如果不写user，就用客户端当前用户登录
```

如果没有免密登录，就会问`客户端`当前账号的密码是什么。

可使用`whoami`命令查看当前账号（用户）。

## 指定私钥登录

默认会到用户目录下的`.ssh`目录找`id_rsa`私钥文件，如果不存在就会要你输入密码。

语法：

```
ssh -i <私钥文件路径> <user>@<ip> 
```





# SSH补充

scp：发送文件

ssh：登录工具（客户端）

ssh-server：提供ssh服务

sftp：登录文件系统的工具？



可以改默认登录目录，到服务端安装路径下找`sshd_config_default`文件，但是ssh运行起来后，Windows上是在`C:\ProgramData\ssh`下的`sshd_config`文件里的。

修改这一项：

``` config
ChrootDirectory D:\
```

即可把目录修改为D盘根目录。