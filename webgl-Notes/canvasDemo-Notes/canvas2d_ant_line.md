# 1. 思路概览

准备好数据，每个粒子应能提供如下数据：

- 坐标（或基于canvas坐标，或局部坐标，总之能转换到canvas即可）
- 外观信息（颜色、尺寸参数等）
- 用于下一次 rAF 更新坐标的动态参数（例如方向、速度等数据）

初始化 canvas 的 context 后，遍历所有点，绘制一次，然后调用 rAF 进行循环。



# 2. 绘制算法

绘制大权是由 context 控制的，所以无论你的绘制算法咋写，代码里一定要能访问到 canvas 的 context （3d也是如此）。

## ① 主渲染函数

``` JS
const demo = function() {
  // context 准备
  ctx.save();
  ctx.fillStyle = '#0a0a1f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  
  // 对于数据数组 ants，遍历，更新并渲染 每一个 ant
  ants.forEach(function(ant) {
    ant.update(ants);
    ant.render();
  });
  requestAnimationFrame(demo);
}

requestAnimationFrame(demo);
```

> 题外话
>
> 我看这玩意儿怎么跟 cesium 的主渲染函数那么像呢...应该这个就是最原始的渲染循环样本了吧？

## ② 粒子更新

```js
ant.update(ants);
```

传入 ants，是为了进行碰撞检测。2d单点的碰撞检测还算比较好解决，复杂的图形碰撞或3d碰撞就没那么简单了。

看完整的函数：

``` JS
Ant.prototype.update = function(ants) {
  // 更新方向（弧度角），以供下一帧的位移使用
  this.direction += (Math.random() > 0.5) ? 0.1 : -0.1;

  // 碰撞检测，距离小于尺寸即认为两个点相遇，将方向反过来
  var that = this; 
  ants.forEach(function(ant) {
    if (that.distanceFromAnt(ant) < that.size) {
      that.direction += Math.PI / 2;
      ant.direction -= Math.PI / 2;
    }
  });

  // 撞边检测，撞到canvas的边缘后令方向反向（加360°）
  if (this.x < 0 || this.y < 0 || this.x > canvas.width || this.y > canvas.height) {
    this.direction += Math.PI / 2;
  }

  // 计算下一帧的位移量
  var dx = Math.cos(this.direction) * this.speed;
  var dy = Math.sin(this.direction) * this.speed;

  // 相当于 v = v0 + at 了，计算下一帧的位置
  this.x += dx;
  this.y += dy;
};
```

这个简单的例子有一个特点，就是数据状态自更新，不需要外部数据介入。

## ③ 粒子渲染

对于数据的更新已经由 update 完成，对于数据的渲染，则需要 context 对象的参与

``` JS
Ant.prototype.render = function() {
  // 保存上一帧的状态（透明度 背景色啥的）
  ctx.save();
  
  // 设置 “画笔”
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#4a6';
  ctx.lineWidth = 0;
  
  // 开始画图
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size / 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // 复原上一帧的状态
  ctx.restore();
}
```



# 完整代码

``` html
无
```

``` CSS
* {
    margin: 0px;
    padding: 0px;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
```

``` JS
let canvas = document.createElement('canvas');
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
ctx.globalAlpha = 0.15;

function Ant() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.direction = Math.random() * 2 * Math.PI;
    this.size = 8;
    this.speed = 2;
}
Ant.prototype.update = function(ants) {
  // 更新方向（弧度角），以供下一帧的位移使用
  this.direction += (Math.random() > 0.5) ? 0.1 : -0.1;

  // 碰撞检测，距离小于尺寸即认为两个点相遇，将方向反过来
  var that = this; 
  ants.forEach(function(ant) {
    if (that.distanceFromAnt(ant) < that.size) {
      that.direction += Math.PI / 2;
      ant.direction -= Math.PI / 2;
    }
  });

  // 撞边检测，撞到canvas的边缘后令方向反向（加360°）
  if (this.x < 0 || this.y < 0 || this.x > canvas.width || this.y > canvas.height) {
    this.direction += Math.PI / 2;
  }

  // 计算下一帧的位移量
  let dx = Math.cos(this.direction) * this.speed;
  let dy = Math.sin(this.direction) * this.speed;

  // 相当于 v = v0 + at 了，计算下一帧的位置
  this.x += dx;
  this.y += dy;
};
Ant.prototype.distanceFromAnt = function(ant) {
    return Math.sqrt(
        Math.pow(this.x - ant.x, 2) +
        Math.pow(this.y - ant.y, 2)
    );
}
Ant.prototype.render = function() {
  // 保存上一帧的状态（透明度 背景色啥的）
  ctx.save();
  
  // 设置 “画笔”
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#4a6';
  ctx.lineWidth = 0;
  
  // 开始画图
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size / 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // 复原上一帧的状态
  ctx.restore();
}

const ants = [];
for (let i = 0; i < 30; i++) {
    ants.push(new Ant());
}

const demo = function() {
    // 保存上一帧的状态（不包括图像？）
    ctx.save();
    ctx.fillStyle = '#0a0a1f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ants.forEach(function(ant) {
        ant.update(ants);
        ant.render();
    });
    requestAnimationFrame(demo);
}

requestAnimationFrame(demo);
```

# 更复杂的例子

``` HTML
<canvas></canvas>
```

``` CSS
body {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: black;
}

canvas {
  width: 100%;
  height: 100%;
}
```

``` JS
'use strict';

const CANVAS = document.getElementsByTagName('canvas')[0],
	CTX = CANVAS.getContext('2d'),
	W = window.innerWidth,
	H = window.innerHeight,
	S = Math.min(W, H),
	NUM_CIRCLES = 500,
	ATTRACTION = 0.25,
	SPREAD = 1.5,
	RANGE = 0.9,
	MAX_CIRCLE_SIZE = 3,
	CIRCLES = [];

class Circle {
	constructor() {
		this.pos = new Vector(W / 2, H / 2);
		this.vel = new Vector(Math.random() * SPREAD + RANGE, Math.random() * SPREAD + RANGE);
		this.rot = Math.random() * Math.PI * 2;
		this.color = '#3699';
		this.r = Math.random() * (MAX_CIRCLE_SIZE - 1) + 1;
	}

	update() {
		const ROT_VEL = Math.random() * ATTRACTION;
		const XCoord = this.pos.x - W / 2;
		const YCoord = this.pos.y - H / 2;

		let dx = this.vel.x * Math.cos(this.rot);
		let dy = this.vel.y * Math.sin(this.rot);
		dx -= XCoord / (S / 2);
		dy -= YCoord / (S / 2);
		this.pos.add(dx, dy);

		this.rot += (Math.random() - Math.random()) * ROT_VEL;
	}

	draw() {
		CTX.beginPath();
		CTX.fillStyle = this.color;
		CTX.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
		CTX.fill();
		CTX.closePath();
	}
}

class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	add(a, b) {
		this.x += a;
		this.y += b;
	}
}

function renderCircles() {
	for (let i = 0; i < CIRCLES.length; i++) {
		CIRCLES[i].update();
		CIRCLES[i].draw();
	}
}

function loop() {
	window.requestAnimationFrame(loop);
	CTX.fillStyle = 'rgba(0,0,0,0.1)';
	CTX.fillRect(0, 0, W, H);
	renderCircles();
}

function createCircles() {
	for (let i = 0; i < NUM_CIRCLES; i++) {
		CIRCLES.push(new Circle());
	}
}

function init() {
	CANVAS.width = W;
	CANVAS.height = H;
	createCircles();
	loop();
}
init();
```

