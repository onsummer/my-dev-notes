参考自 https://blog.csdn.net/weixin_49608678/article/details/109542904

# Entity API 和 Primitive API 添加 gltf 模型的区别

Entity API 能传入 position、orientation 等比较容易看懂的属性，而 Primitive API 传入的是矩阵。

原文提及，直接修改 entity 的 position 是行不通的：

> 相信有很多小伙伴会遇到跟我一样的问题，直接修改position，值会改变但是模型的位置并不会变化，然后我去查看了Cesium的API文档，这里想要修改position或者orientation都需要使用回调函数。方法很简单，只需要返回你需要的坐标或者方位就好了。

所以，他为 entity 传入了 CallbackProperty，而不是简单的 Cartesian3：

``` JS
let mycar = viewer.entities.add({
  id:'car',
  position: new Cesium.CallbackProperty(getPosition, false),
  orientation: new Cesium.CallbackProperty(getOrientation, false),
  model: { uri:'/static/model/GLTFformat/taxi.glb' }
});
```

---

另一篇：控制小车行驶

https://blog.csdn.net/weixin_49608678/article/details/109524419

# 主要是监听键盘

``` JS
// 首先，先对键盘事件做监听
document.addEventListener('keydown',(e)=>{
  setFlagStatus(e, true);
});

document.addEventListener('keyup',(e)=>{
  setFlagStatus(e, false);
});

// setFlagStatus 函数是处理状态的
// 小车状态标志
let flag = {
  moveUp:false,
  moveDown:false,
  moveLeft:false,
  moveRight:false
};
// 根据键盘按键返回标志
function setFlagStatus(key,value) {
  switch (key.keyCode){
    case 37:
      // 左
      flag.moveLeft = value;
      break;
    case 38:
      // 上
      flag.moveUp = value;
      break;
    case 39:
      // 右
      flag.moveRight = value;
      break;
    case 40:
      flag.moveDown = value;
      // 下
      break;
  }
}

// 然后对时钟的 tick 事件进行监听
viewer.clock.onTick.addEventListener((clock)=>{
  // 判断状态，修改 hpr
  if(flag.moveUp){
    if(flag.moveLeft){
      hpRoll.heading -= radian;
      count += 2;
    }
    if(flag.moveRight){
      hpRoll.heading += radian;
      count -= 2;
    }
    moveCar(1);
  }else if(flag.moveDown){
    if(flag.moveLeft){
      hpRoll.heading -= radian;
      count += 2;
    }
    if(flag.moveRight){
      hpRoll.heading += radian;
      count -= 2;
    }
    moveCar(-1);
  }else {
    if(flag.moveLeft){
      hpRoll.heading -= radian;
      count += 2;
      moveCar(0)
    }
    if(flag.moveRight){
      hpRoll.heading += radian;
      count -= 2;
      moveCar(0)
    }
  }
});

// 最后根据速度（及方向）、新的hpr计算新的位置，移动小车
function moveCar(isUP) {
  // 计算速度矩阵
  if(isUP===1){
    speedVector = Cesium.Cartesian3.multiplyByScalar(
      Cesium.Cartesian3.UNIT_X,
      speed,
      speedVector);
  }else if(isUP===-1){
    speedVector = Cesium.Cartesian3.multiplyByScalar(
      Cesium.Cartesian3.UNIT_X,
      -speed,
      speedVector);
  }else{
    speedVector = Cesium.Cartesian3.multiplyByScalar(
      Cesium.Cartesian3.UNIT_X,
      0,
      speedVector);
  }

  // 根据速度计算出下一个位置的坐标
  position = Cesium.Matrix4.multiplyByPoint(
    carPrimitive.modelMatrix,
    speedVector, 
    position);

  // 小车移动
  Cesium.Transforms.headingPitchRollToFixedFrame(
    position, 
    hpRoll, 	
    Cesium.Ellipsoid.WGS84, 
    fixedFrameTransforms, 
    carPrimitive.modelMatrix);
}
```

