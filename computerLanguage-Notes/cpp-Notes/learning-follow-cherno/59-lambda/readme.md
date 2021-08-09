函数指针和lambda结合一起用最合适

``` cpp
void main() 
{
  auto lambda = [](int value) { std::cout << value << std::endl; }
  // 传递函数
  std::cin.get();
}
```

后面两部分好理解，参数列表和函数体，但是前面的方括号就很奇怪

看下例：

``` cpp
void main() 
{
  int a = 5;
  // 报错，找不到a
  auto lambda = [](int value) { std::cout << a << std::endl; }
  
  std::cin.get();
}
```

方括号就是指明 lambda 关注的内容，类似于 js 中的 this、react 中的 useEffect

可以修改为：

``` cpp
void main() 
{
  int a = 5;
  auto lambda = [&](int value) { std::cout << a << std::endl; }
  
  std::cin.get();
}
```

