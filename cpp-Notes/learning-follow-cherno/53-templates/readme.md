模板并不是 Java、CSharp 里的泛型，模板比泛型更强大。

# 基本语法

``` cpp
#include <iostream>
#include <string>

template<typename T>
void Print(T value) 
{
	std::cout << value << std::endl;  
}

void main() 
{
  Print(5);
  Print(5.5f);
  // 或者显式指定
  Print<std::string>("Hello");
  
  std::cin.get();
}
```

# 你不知道的

- 模板，在调用它的时候才会真正编译

  ``` cpp
  template<typename T>
  void Print(T value) 
  {
  	std::cout << AAAAAAAAAAAAA << std::endl;  // 编译成功 但是没调用不会报错
  }
  
  void main() 
  {
    std::cin.get();
  }
  ```

  

- 参数T可以改为你喜欢的任意字符

- 模板，不一定是类型被模板，任意东西都可以被模板，这就是跟泛型的根本区别

``` c++
#include <iostream>

template<int N>
class Array
{
private:
  int m_Array[N];
public:
  int GetSize() const 
  {
    return N;
  }
}

void main()
{
  Array<5> array;
  std::cin.get()
}
```

