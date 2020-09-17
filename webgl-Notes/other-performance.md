## webgl优化技巧

https://blog.csdn.net/Amesteur/article/details/95638611

**Webgl性能瓶颈，图形绘制是异步的流水线绘制以及浏览器的本身的缺陷。尝试优化的方法如下：**

- 找到性能瓶颈，尝试降低CPU或者GPU的时钟频率去测试哪个效率低
- 纹理受限，可以采取 减少canvas的长宽或者使用低分辨率的纹理测试；webgl 纹理绑定伸展和收缩效果时，gl.NEAREST 是最快的但会产生块状效果，gl.LINER因为是取平均值，会产生模糊
- 将Mip映射应用于纹理贴图
- 处理webgl丢失上下文的问题
- 不要经常切换program，在切换program和在着色器中使用if else语句都需要进行考量

**高级shader优化，基本思路是找到性能瓶颈，尝试降低CPU或者GPU的时钟频率去测试哪个效率低：**

- 避免在顶点数组数据中使用常量
- 在webgl中，使用drawElements()的gl.TRIANGLE_STRIP 结合退化三角形 比使用drawArrays()的gl.TRIANGLE方式节省内存,并且减少使用drawArrays和drawElements的次数
- 顶点组织顺序按照数组排序，不要使用乱序，因为难以命中缓存
- 减少使用drawArrays和drawElements的次数
- 避免绘制时从GPU读回数据或状态,例如，gl.getError() gl.readPixels(), 影响流水线的实现
- 用webgl inspector找出冗余的调用，因为webgl是的状态是跨帧持续的，减少使用改变webgl状态的方法。比如gl.enable(XXX)，只执行一次就行了

**模型优化：**

- 用细节层次简化模型（LOD技术）

**其他新的怪异想法：**

- 利用WebAssembly技术，提高Web应用程序的性能;
- 利用`OffscreenCanvas+Web Worker方案，OffscreenCanvas是另外一个作为幕后计算的Canvas与幕前显示的Canvas做频繁替换`

## 讲到三角扇等顶点级别的优化

https://blog.csdn.net/u011294404/article/details/53605873

退化三角形

这篇绝赞，有例子有图

## 使用扩展

http://www.jiazhengblog.com/blog/2017/03/20/3104/

使用ANGLE_instanced_arrays扩展提高性能

## 使用WebWorker以及传ArrayBuffers引用提高效率

https://blog.csdn.net/u013929284/article/details/73691469

### WebGL上Web Worker的使用

  WebGL里经常会对大量顶点数据和索引数据进行计算，由于js单线程的原因，很容易造成堵塞，性能低下。通过web worker可以让js在后台解决这些问题。
  worker线程与主线程的数据传递使用的是结构化克隆，当数据量非常大的时候耗时严重，需用通过序列化的方式（JSON.stringfy）来传递数据。经测试，我起了四个线程来传递json对象，不序列化的时候是602ms，使用序列化的方式传递是186ms，性能明显提升。
  另外，针对webgl的数据类型大多都是arraybuffer类型，web worker中有一个非常实用的参数，那就是Transferable Objects。一旦对象是 Transferable 的，那么传递过程不再使用结构化克隆，而是按引用传递，这就避免了克隆导致的额外开销。只有诸如 ArrayBuffer、ImageBitmap 这样的二进制数据类型才可以。
  在Cesium当中，关于大数据量顶点的处理就是采用web worker来处理的。Cesium提供了一个TaskProcessor类来自定义一个工作线程，该类实际上就是包装了一个web worker，通过scheduleTask方法来定义异步任务。

https://mp.weixin.qq.com/s?__biz=MzIzNDE0NjMzOQ==&mid=2653923832&idx=1&sn=25621f89fcd712b408634d53cd4a273a&chksm=f321d6b4c4565fa224e152ba8ded4abb599b9412abd8e8f201c30b4bfc1d0e33d08eb455694a&mpshare=1&scene=23&srcid=0516nZgoMT8Yjri8Vc1N5ug1#rd

百度团队在地图引擎中使用webworker

### webworker简介

https://juejin.im/entry/6844903478091841549

## 离屏canvas：利用WebWorker

## 数据太大导致内存爆炸：大规模WebGL应用引发浏览器崩溃的几种情况及解决办法

https://blog.csdn.net/mythma/article/details/51507743