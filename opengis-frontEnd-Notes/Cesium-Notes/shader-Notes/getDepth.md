```glsl
// 获取深度
float getDepth(){
  float z_window = czm_unpackDepth(texture2D(depthTexture, v_textureCoordinates)); // 从深度纹理中获取对数深度值
  z_window = czm_reverseLogDepth(z_window); // 转为普通深度值
  float n_range = czm_depthRange.near;
  float f_range = czm_depthRange.far;
  return  (2.0 * z_window - n_range - f_range) / (f_range - n_range); // ？
}
```

> `float globeDepth = czm_unpackDepth(texture2D(czm_globeDepthTexture, textureCoordinate));` is the right way to get the depth value of Cesium.
>
> https://groups.google.com/g/cesium-dev/c/K6XUfUV451I/m/fMW1A5RFBwAJ

所以说，这个函数第一行代表从某个深度纹理中获取深度值，而且是对数深度值

后面的暂时看不懂

# float czm_unpackDepth(vec4 value)

函数定义如下：

``` glsl
 float czm_unpackDepth(vec4 packedDepth)
 {
    return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
 }
```

它的作用是将一个 vec4 类型的深度向量编码到一个介于 [0, 1) 的浮点数。

参考文章：http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/

# float czm_reverseLogDepth(float value)

> 函数接受一个对数深度值，返回普通深度值

函数定义如下：

``` glsl
float czm_reverseLogDepth(float logZ)
{
#ifdef LOG_DEPTH
    float near = czm_currentFrustum.x;
    float far = czm_currentFrustum.y;
    float log2Depth = logZ * czm_log2FarDepthFromNearPlusOne;
    float depthFromNear = pow(2.0, log2Depth) - 1.0;
    return far * (1.0 - near / (depthFromNear + near)) / (far - near);
#endif
    return logZ;
}
```

如果定义了 `LOG_DEPTH` 这个宏，那么才进行对数深度计算，否则直接返回参数。

其主要计算过程是：

- 获取当前视锥截头体的 x、y 值，作为远近值；
- 获取底数是 2 的对数深度值（使用到一个自动 uniform 变量 `czm_log2FarDepthFromNearPlusOne`）
- 计算近值的对数深度值
- 返回计算结果：
  - $near / (d_{near} + near)$  是近值到视点占计算点到视点的比例，不妨记作 A
  - 1 - A 代表计算点到近点这段距离，占计算点到视点距离的比例，记作 B
  - 远值乘以 B，相当于计算点到近点距离拉伸到远点这么长
  - 最后除以视锥截头体长度（far - near）（意义不明）

如果 near 值相对 far 来说很小很小，那么这个返回值将非常接近 far 值。



## 自动Uniform

是指由 `Source/Renderer/AutomaticUniforms.js` 模块中导出的一个普通 js 对象：`AutomaticUniforms`，它能在每一帧将 Cesium 的全局状态，即 `uniformState` 对象中的数据值，例如椭球体的尺寸、太阳光方向等，传递到 glsl 中。

通常一个自动 Uniform 的定义是：

``` js
var AutomaticUniforms = {
  czm_name: new AutomaticUniform({
  	size: 1, // 通常是1
  	datatype: WebGLConstants.XXX, // 数值类型
	  getValue: function (uniformState) {
    	return uniformState.XXX; // 获取值的方法
  	}
	})
};

export default AutomaticUniforms;
```



## 自动Uniform：czm_log2FarDepthFromNearPlusOne

是 `czm_farDepthFromNearPlusOne` 以 2 为底的对数值。定义在 `uniformState.log2FarDepthFromNearPlusOne` 上

## 自动Uniform：czm_farDepthFromNearPlusOne

远平面到近平面的距离再加 1，定义在 `uniformState.farDepthFromNearPlusOne` 上

## UniformState 中的定义

在 `UniformState.prototype.updateFrustum` 方法中，会更新截头体参数，其中对私有变量 `_farDepthFromNearPlusOne` 和 `_log2FarDepthFromNearPlusOne` 进行更新：

``` js
UniformState.prototype.updateFrustum = function (frustum) {
  // ...
  this._farDepthFromNearPlusOne = frustum.far - frustum.near + 1.0;
  this._log2FarDepthFromNearPlusOne = CesiumMath.log2(
    this._farDepthFromNearPlusOne
  );
  // ...
};
```



# czm_depthRange

一个结构体常量，其定义为：

``` glsl
const czm_depthRangeStruct czm_depthRange = czm_depthRangeStruct(0.0, 1.0);
```

是 Cesium 一个内置的 GLSL vec2 常量，用来定义 **深度范围**。

用来解决 IE11 不支持 `gl_DepthRange` 的问题。

## 结构体：czm_depthRangeStruct

``` glsl
struct czm_depthRangeStruct
{
    float near;
    float far;
};
```

