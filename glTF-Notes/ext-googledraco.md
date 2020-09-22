记一次 Google Draco 源代码编译经历：使用Windows 10 + VS 2019

# 下载源码

官方仓库：https://github.com/google/draco

![image-20200823090057997](attachments/image-20200823090057997.png)

到发布页下载最新版，解压出来是这样的。

# 先决条件

安装了：

- Visual Studio 2019（with `使用C++ 的桌面开发`扩展，有点大，耐着性子装吧）

  ![image-20200823085748329](attachments/image-20200823085748329.png)

- CMake

CMake版本取决于源码中 `CMakeLists.txt` 的这一行：`cmake_minimum_required(VERSION 3.5 FATAL_ERROR)`

于是，我下载了最新版 CMake。

VS的小版本应该不用在意，CMake会帮我们生成 sln 解决方案的。

# 使用 CMake GUI 生成 vs 解决方案

## 创建目标目录



## 配置



## 生成 vs 解决方案