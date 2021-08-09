# 1. 挨个传

``` js
gl.uniformMatrix4v(...)
gl.uniform4f(...)
gl.vertexAttrib3f(...)
```



# 2. VBO

通过使用 WebGLBuffer 实现一批数据整体通过 ArrayBuffer（TypeArray） 传入

``` js
gl.createBuffer()
gl.bindBuffer()
gl.bufferData()

// 使用
gl.vertexAttribPointer()
```



# 3. VAO

把 IBO 和 VBO 合成一个，webgl 1.0 通过扩展实现，webgl 2.0 原生支持。



> 上面都是顶点数据，纹理数据、uniform数据另有它法