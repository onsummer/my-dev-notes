# 四种不同的字符指针

``` cpp
#include <stdlib.h>

const char* name1 = u8"Cherno"; // 1byte per char
const wchar_t* name2 = L"Cherno"; // 8byte per char
const char16_t* name3 = u"Cherno"; // 2byte per char
const char32_t* name4 = U"Cherno"; // 4byte per char
```

# 非要在声明时拼接字符串

``` cpp
#include <string>

using namespace std::string_literals;
str::string name = u8"Che"s + "rno";
str::wstring name2 = L"Che"s + L"rno";
str::u32string name3 = U"Che"s + U"rno";
```



# 类似 es6 中的 `` 字符串

在字符串前面加一个字母 `R`，就能方便换行了，而不是用 `\n`

``` cpp
#include <string>

using namespace std::string_literals;
const str::string name = R"Line1
  Line2
  Line3";
```

