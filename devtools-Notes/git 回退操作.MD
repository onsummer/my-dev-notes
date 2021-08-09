> 本篇不适用于新手，适合有一定基础但是没怎么用过回滚的同学

# 1. 本地commit前

## 1.1 本地add前

add之前若想回退，使用`checkout`命令：

``` bash
git checkout -- <文件路径或.>
```

## 1.2 本地add后

使用reset命令

``` bash
git reset HEAD <文件路径或.>
```

# 2. 本地commit后

## 2.1 创建一个新的版本进行回退

使用revert命令

``` bash
git revert <tag或者版本号>
```

## 2.2 不可逆式回退

使用`reset`命令

``` bash
git reset --hard <tag或版本号>
```

## 2.3 仅仅修改commit注释不回退

``` bash
git commit --amend
```
这个命令在Windows下会打开默认编辑器，编辑第一行然后保存、关闭即可更新当前commit的备注。

# 3. reset命令

这个命令属于不可逆式撤销，有多个选项

- ① --soft

例如命令
``` bash
git reset --soft HEAD^
```

仅仅撤销当前commit，代码仍然保留。即撤销commit，不撤销add。（恢复到`git add .`执行完毕的状态）

- ② --mixed
例如命令
``` bash
git reset --mixed HEAD^
```

不删除代码。撤销commit，也撤销add。（恢复到`git add .`执行前的状态，即编写完代码并未暂存）

- ③ --hard
例如命令
```bash
git reset --hard HEAD^
```
删除代码，撤销commit，也撤销add。
等价于恢复到上一个commit的状态，过程不可逆。（恢复到上一版本，并且**当前版本所有数据删除**）

## HEAD
上面提及的HEAD^等于恢复到上一版本，下面两个写法相同
``` bash
git reset <参数，例如--soft> HEAD^
```

``` bash
git reset <参数，例如--soft> HEAD~
```

如果要回退2个版本，可以这么写：
``` bash
git reset <参数，例如--soft> HEAD~2
```

# 参考文档
[1]. [git中文官方文档](https://git-scm.com/book/zh/v2)