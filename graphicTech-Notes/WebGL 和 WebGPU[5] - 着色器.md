不具体介绍wgsl和glsl的区别，范围太大

只介绍 WebGPU API 和 WebGL API 上的差别



WebGPU 支持自定义指定入口函数。WebGPU 支持获取编译信息

WebGPU 可以先创建着色器模块对象，而不编译。

着色器模块由 pipeline 使用，而 pipeline 最终由 renderPassEncoder 所设置，即 renderPassEncoder.setPipeline

WebGL 中 pipeline 对应的对象是 WebGLProgram，每次切换就需要 gl.useProgram