/* 
    数据两大类型：值类型和引用类型

    值类型：变量，直接存储值，存储在栈内存中，赋值是值的拷贝
    引用类型：对象，存储在堆内存中，赋值是引用的拷贝，栈存储的是内存地址

    考点一：函数参数传递：JS永远是按值传递，值类型：传递值的副本，引用类型：传递引用的副本

    考点二：const 的不变性 ：const保证的是变量引用的不变性，而不是变量值的不变性,即地址不变性，值可变,const保证一直指向一个对象，不允许指向新对象

    考点三：==比较的细节：值类型比较值，===引用类型比较引用

    function test(obj){
        obj.name = 'new name'
        obj = {name: 'new name2'}
    }
    let obj = {name: 'old name'}
    test(obj)
    console.log(obj.name) // new name
    console.log(obj) // {name: 'new name'}
    console.log(obj === {name: 'new name'}) // false
    console.log(obj === {name: 'new name2'}) // false
    console.log(obj === {name: 'old name'}) // false
    console.log(obj === {name: 'new name'}) // false
    console.log(obj === {name: 'new name2'}) // false
    console.log(obj === {name: 'old name'}) // false
    总结：JS中函数传参永远按值传递，值类型传递值的副本，引用类型传递引用的副本,可以改变值，但不能通过变量赋值改变变量本身
*/