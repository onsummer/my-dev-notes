# ① IFC规范与ifc文件格式

ifc规范目前已经演进到 4.1 了？

ifc 文件是一种文本文件，其内置的数据描述语言是 Express

其大致结构为

```
ISO-10303-21;
HEADER;
...
ENDSEC;
DATA;
...
ENDSEC;
END-ISO-10303-21;
```

观察得知最外层是 `ISO-10303-21` 和 `END-ISO-10303-21` 两个 “标签”，其下是 `HEADER` 和 `DATA` 两个标签，结束标签均为 `ENDSEC` 。

# ② 观察得到的结论

## DATA标签

里面都是 `#<数字> = <类名>(该类的参数);`

## HEADER标签

有 `FILE_DESCRIPTION`、`FILE_NAME`、`FILE_SCHEMA`

- `FILE_DESCRIPTION`：对文件的描述
- `FILE_NAME`：文件名，创建时间，软件等信息
- `FILE_SCHEMA`：IFC版本，例如 `IFC2X3`等

# ③ 免费软件

- usBIM.viewer（看Ifc类结构方便）
- BIMVision（支持glTF插件导出）

# ④ 博客

## 参考手册

- IFC4.1

官方地址：https://standards.buildingsmart.org/IFC/RELEASE/IFC4_1/FINAL/HTML/

国内地址1：http://www.vfkjsd.cn/ifc/ifc4_1/buildingsmart/index.htm

国内地址2：http://www.bim-times.com/ifc/ifc4_1/buildingsmart/index.htm 

- IFC4

国内地址1：http://www.vfkjsd.cn/ifc/ifc4/index.htm

国内地址2：http://www.bim-times.com/ifc/ifc4/index.htm

官方地址：http://www.buildingsmart-tech.org/ifc/IFC4/Add2/html/

官方4.3规范文档：[IFC4 Documentation (buildingsmart.org)](https://standards.buildingsmart.org/IFC/DEV/IFC4_3/RC2/HTML/)

- IFC2x3参考手册

国内地址：http://www.bim-times.com/ifc/ifc2x3/index.htm

官方地址：http://www.buildingsmart-tech.org/ifc/IFC2x3/TC1/html/index.htm

## IFC文档结构

https://www.cnblogs.com/herd/p/6489085.html

## 博客：西北逍遥

https://www.cnblogs.com/herd/category/957250.html

## IFC映射到关系数据库

http://cpfd.cnki.com.cn/Article/CPFDTOTAL-JGCB201811001064.htm

## buildingSmart网站

https://technical.buildingsmart.org/

## ISO标准

https://www.iso.org/standard/63141.html