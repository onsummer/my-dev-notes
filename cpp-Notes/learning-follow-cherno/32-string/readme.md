``` cpp
#include <iostream>

void main()
{
  const char* name = "Cherno";
  // 不要 const 也可以
  // 不要 const 的话，把指针改为数组，char[]，你可以把其中某个字符改成
  // name[2] = 'A'; 即 "ChArno"
  std::cin.get();
}
```

# 字符指针表示的字符串，结尾必须是 '\0'

这点是继承自 C 的

即上述的 name 变量实际字符长度是 7 .



# string模板

``` CPP
#include <string>

void main()
{
 	std::string name = "Cherno";
  std::cout << name << std::endl;
  
  std::cin.get();
}
```

## 有趣的现象：字面量与string实例

```cpp
std::string name = "C" + "herno"; // 失败
std::string name = std::string("C") + "herno"; // 成功
```

这是因为，std::string 已经重载了 `+`、`+=` 等操作符，方便拼接。

## 注意：传递string到别的作用域时，如无必要，尽可能确保其为const

```cpp
void PrintString(const std::string& str)
{
  // 这样 str 就是引用传递且不能修改了
  std::cout << str << std::endl;
}
```

## 字面量

``` cpp
"Cherno"; // 这个是字面量，实际上是 char* 或 char[]，而不是 string
```

