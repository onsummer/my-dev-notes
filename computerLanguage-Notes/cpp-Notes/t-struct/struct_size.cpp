#include <iostream>

struct TypeA // --> 12 byte = (1 + 3x(1)) + 4 + (1 + 3x(1))
{
  char member_char; // 1
  int member_int; // 4
  char member_char2; // 1
};

struct TypeB  // --> 8 byte = 4 + (1 + 1 + 2x(1)) = 8
{
  int member_int; // 4
  char member_char; // 1
  char member_char2; // 1
};

struct TypeC  // -->  8 byte = (1 + 1 + 2x(1)) + 4 = 8
{
  char member_char; // 1
  char member_char2; // 1
  int member_int; // 4
};

struct TypeD // --> 6 byte
{
  char a; // 1 --> fill 2
  char b; // 1 --> fill 2
  short c; // 2 --> fill 2
};

struct TypeComplexA // --> 18 byte
{
  char a; // 1 --> fill 6
  short b; // 2 --> fill 6
  TypeC member_struct; // 6
};

struct TypeComplexB // --> 12 byte
{
  TypeC member_struct; // 6
  char a; // 1 
  short b; // 2 --> fill 6
};

/**
 * 结构体在各种编译器不同，当前代码使用 g++ 8.1 （mingw）编译输出，分别是 12、8、8 byte 的大小
 * VC++ 2019 也是这个结果
 * 
 * struct 的结果不仅与最大那个值有关，还跟排列顺序有关
 *   - 设结构体内最大元素的字节大小为 k
 *   - 若第一个元素的字节大小为 k，则继续
 *     - 若下一个不为 k，则依次按顺序将后面的元素填入 k 字节，直到再填一个就超过 k 为止
 *   - 若第一个元素的字节大小不为 k，则它自己占满 k 字节，下一个元素从 k + 1 字节开始
 *   
 *   所以结构体的大小一定是 k 的倍数。
*/
int main() {
  std::cout << sizeof(TypeComplexA) << std::endl;
  return 0;
}
