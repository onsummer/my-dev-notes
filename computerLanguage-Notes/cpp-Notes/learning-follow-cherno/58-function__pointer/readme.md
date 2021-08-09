考虑如下例子

``` c++
#include <iostream>

void HelloWorld()
{
  std::cout << "Hello World!" << std::endl;
}

void main()
{
  auto function = HelloWorld;
  function();
  // 实际写法
	// void(*function)() = HelloWorld;
  // function();
  std:：cin.get();
}
```



函数指针的写法

返回值(*函数指针名)(参数类型列表)

``` cpp
void(*HelloWorld)(int, float);
```



比对委托：

```C#
delegate void HelloWorld(int params1, float params2);
```

# 用法：回调函数

``` CPP
#include <iostream>
#include <vector>

void PrintTime2Value(int v)
{
  std::cout << 2 * v << std::endl;
}

void ForEach(const std::vector<int>& arr, void(*callback)(int))
{
  for (int item : arr)
    callback(item);
}

void main()
{
  std::vector<int> arr = { 1, 2, 5, 4, 3 };
  ForEach(arr, PrintTime2Value);
  
  std::cin.get();
}
```

# 使用预设好的模板

``` cpp
#include <iostream>
#include <vector>
#include <functional> // <- 注意这个

void ForEach(const std::vector<int>& value, const std::function<void(int)>& func)
{
  for (int value : values)
    func(value);
}

void main()
{
  std::vector<int> values = { 1, 5, 4, 3, 2 };
  
  auto lambda = [=](int value){ std::cout << value << std::endl; };
  ForEach(values, lambda);
  std::cin.get();
}
```

