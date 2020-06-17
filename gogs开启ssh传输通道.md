# gogs开启ssh传输通道

配置文件写入：

``` INI
RUN_USER = Administrator

[server]
DOMAIN           = 192.168.11.203
HTTP_PORT        = 3000
ROOT_URL         = http://192.168.11.203:3000/
DISABLE_SSH      = false
SSH_PORT         = 33
SSH_ROOT_PATH    = C:/Users/Administrator.WIN-10N572NUTP4/.ssh
START_SSH_SERVER = true
OFFLINE_MODE     = false
REWRITE_AUTHORIZED_KEYS_AT_START = false
```

端口要和openssh服务所用的22端口区分开，就用了33端口，然后配置一下服务器保存公私钥的路径。

注意：RUN_USER是本机用户名，不是本机计算机名...

START_SSH_SERVER也要配一下。

除此之外，把自己的公钥贴上去就能git clone了。