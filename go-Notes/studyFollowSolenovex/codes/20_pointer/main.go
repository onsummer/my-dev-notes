package main

import "fmt"

type person struct {
	name string
	age  int
}

func (p *person) birthday() {
	p.age++
}

func main() {
	one := &person{
		name: "one",
		age:  14,
	}

	one.birthday()

	fmt.Printf("%+v\n", one)
}
