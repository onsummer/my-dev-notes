逻辑说明

- constructor：这里采用ES6的新语法，用来构造每种标绘类型的构造函数（js没有类的概念，就是一个语法糖，谁不知道呢？）
- getData：返回该标绘对象坐标数据，该数据可以存储到数据库，用于二次从数据库中直接读取加载该标绘（谁规定非要用鼠标交互绘制呢？）
- loadXXX(data):将getData返回的数据传入该函数中，即可重新构造出该标绘（数据导入构建）
- startCreate：注册鼠标交互事件，用于绘制该标绘（鼠标交互构建）
- destroy：销毁鼠标交互
- clear：清空临时实体对象

# 点

``` JS
// DrawPoint
/*
绘制点
 */
class DrawPoint {
    constructor(arg) {
        this.viewer = arg.viewer;
        this.Cesium = arg.Cesium;
        this.callback=arg.callback;
        this._point = null;  //最后一个点
        this._pointData = null;//点数据用于构造点
        this._entities = []; //脏数据
    }
 
    //返回最后活动点
    get point() {
        return this._point;
    }
 
    //加载点
    loadPoint(data) {
        return this.createPoint(data);
    }
 
    //返回点数据用于加载点
    getData() {
        return this._pointData;
    }
 
    //开始绘制
    startCreate() {
        var $this = this;
        this.handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction(function (evt) { //单机开始绘制
            var cartesian = $this.getCatesian3FromPX(evt.position);
            if (!cartesian) return;
            var point = $this.createPoint(cartesian);
            $this._pointData = cartesian;
            $this._point = point;
            if(typeof $this.callback=="function"){
                $this.callback(point);
            }
        }, $this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
 
    //创建点
    createPoint(cartesian) {
        var $this = this;
        var point = this.viewer.entities.add({
            position: cartesian,
            point: {
                pixelSize: 10,
                color: $this.Cesium.Color.YELLOW,
            }
        });
        $this._entities.push(point); //加载脏数据
        return point;
    }
 
    //销毁鼠标事件
    destroy() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
    }
 
    //清空实体对象
    clear() {
        for (var i = 0; i < this._entities.length; i++) {
            this.viewer.entities.remove(this._entities[i]);
        }
        this._entities = [];
        this._point = null;
    }
 
    getCatesian3FromPX(px) {
        var cartesian;
        var ray = this.viewer.camera.getPickRay(px);
        if (!ray) return null;
        cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        return cartesian;
    }
}
 
export default DrawPoint;
```

# 折线

``` JS

// DrawPolyline
/*
绘制线
 */
class DrawPolyline {
    constructor(arg) {
        this.viewer = arg.viewer;
        this.Cesium = arg.Cesium;
        this.callback=arg.callback;
        this._polyline = null; //活动线
        this._polylineLast = null; //最后一条线
        this._positions = [];  //活动点
        this._entities_point = [];  //脏数据
        this._entities_line = [];  //脏数据
        this._polylineData = null; //用于构造线数据
    }
 
    //返回最后活动线
    get line() {
        return this._polylineLast;
    }
 
    //返回线数据用于加载线
    getData() {
        return this._polylineData;
    }
 
    //加载线
    loadPolyline(data) {
        var $this = this;
        var polyline = this.viewer.entities.add({
            polyline: {
                positions: data,
                show: true,
                material: $this.Cesium.Color.RED,
                width: 3,
                clampToGround: true
            }
        });
        return polyline;
    }
 
    //开始创建
    startCreate() {
        var $this = this;
        this.handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction(function (evt) { //单机开始绘制
            //屏幕坐标转地形上坐标
            var cartesian = $this.getCatesian3FromPX(evt.position);
            if ($this._positions.length == 0) {
                $this._positions.push(cartesian.clone());
            }
            $this._positions.push(cartesian);
            $this.createPoint(cartesian);// 绘制点
        }, $this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction(function (evt) { //移动时绘制线
            if ($this._positions.length < 1) return;
            var cartesian = $this.getCatesian3FromPX(evt.endPosition);
            if (!$this.Cesium.defined($this._polyline)) {
                $this._polyline = $this.createPolyline();
            }
            if ($this._polyline) {
                $this._positions.pop();
                $this._positions.push(cartesian);
            }
        }, $this.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction(function (evt) {
            if (!$this._polyline) return;
            var cartesian = $this.getCatesian3FromPX(evt.position);
            $this._positions.pop();
            $this._positions.push(cartesian);
            $this.createPoint(cartesian);// 绘制点
            $this._polylineData = $this._positions.concat();
            $this.viewer.entities.remove($this._polyline); //移除
            $this._polyline = null;
            $this._positions = [];
            var line = $this.loadPolyline($this._polylineData); //加载线
            $this._entities_line.push(line);
            $this._polylineLast=line;
            if(typeof $this.callback=="function"){
                $this.callback(line);
            }
        }, $this.Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
 
    //创建点
    createPoint(cartesian) {
        var $this = this;
        var point = this.viewer.entities.add({
            position: cartesian,
            point: {
                pixelSize: 10,
                color: $this.Cesium.Color.YELLOW,
            }
        });
        $this._entities_point.push(point);
        return point;
    }
 
    //创建线
    createPolyline() {
        var $this = this;
        var polyline = this.viewer.entities.add({
            polyline: {
                //使用cesium的peoperty
                positions: new $this.Cesium.CallbackProperty(function () {
                    return $this._positions
                }, false),
                show: true,
                material: $this.Cesium.Color.RED,
                width: 3,
                clampToGround: true
            }
        });
        $this._entities_line.push(polyline);
        return polyline;
    }
 
    //销毁
    destroy() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
    }
 
    //清空实体对象
    clear() {
        for (var i = 0; i < this._entities_point.length; i++) {
            this.viewer.entities.remove(this._entities_point[i]);
        }
        for (var i = 0; i < this._entities_line.length; i++) {
            this.viewer.entities.remove(this._entities_line[i]);
        }
        this._polyline = null;
        this._positions = [];
        this._entities_point = [];  //脏数据
        this._entities_line = [];  //脏数据
        this._polylineData = null; //用于构造线数据
        this._polylineLast=null;
    }
 
    getCatesian3FromPX(px) {
        var cartesian;
        var ray = this.viewer.camera.getPickRay(px);
        if (!ray) return null;
        cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        return cartesian;
    }
}
 
export default DrawPolyline
```

# 三、曲线

``` JS

// DrawCurve
/*
绘制曲线
 */
class DrawCurve {
    constructor(arg) {
        this.viewer = arg.viewer;
        this.Cesium = arg.Cesium;
        this.floatingPoint = null;//标识点
        this._curveline = null; //活动曲线
        this._curvelineLast = null; //最后一条曲线
        this._positions = [];  //活动点
        this._entities_point = [];  //脏数据
        this._entities_line = [];  //脏数据
        this._curvelineData = null; //用于构造曲线数据
    }
 
    //返回最后活动曲线
    get curveline() {
        return this._curvelineLast;
    }
 
    //返回线数据用于加载线
    getData() {
        return this._curvelineData;
    }
 
    //加载曲线
    loadCurveline(data) {
        var $this = this;
        var points = $this.fineBezier(data);
        var polyline = this.viewer.entities.add({
            polyline: {
                positions: points,
                show: true,
                material: $this.Cesium.Color.RED,
                width: 3,
                clampToGround: true
            }
        });
        return polyline;
    }
 
    //开始创建
    startCreate() {
        var $this = this;
        this.handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction(function (evt) { //单机开始绘制
            //屏幕坐标转地形上坐标
            var cartesian = $this.getCatesian3FromPX(evt.position);
            if ($this._positions.length == 0) {
                $this._positions.push(cartesian.clone());
                $this.floatingPoint = $this.createPoint(cartesian);
                $this.createPoint(cartesian);// 绘制点
            }
            $this._positions.push(cartesian);
        }, $this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction(function (evt) { //移动时绘制线
            if ($this._positions.length < 4) return;
            var cartesian = $this.getCatesian3FromPX(evt.endPosition);
            if (!$this.Cesium.defined($this._curveline)) {
                $this._curveline = $this.createCurveline();
            }
            $this.floatingPoint.position.setValue(cartesian);
            if ($this._curveline) {
                $this._positions.pop();
                $this._positions.push(cartesian);
            }
        }, $this.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction(function (evt) {
            if (!$this._curveline) return;
            var cartesian = $this.getCatesian3FromPX(evt.position);
            $this._positions.pop();
            $this._positions.push(cartesian);
            $this.createPoint(cartesian);// 绘制点
            $this._curvelineData = $this._positions.concat();
            $this.viewer.entities.remove($this._curveline); //移除
            $this._curveline = null;
            $this._positions = [];
            $this.floatingPoint.position.setValue(cartesian);
            var line = $this.loadCurveline($this._curvelineData); //加载曲线
            $this._entities_line.push(line);
            $this._curvelineLast = line;
        }, $this.Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
 
    //创建点
    createPoint(cartesian) {
        var $this = this;
        var point = this.viewer.entities.add({
            position: cartesian,
            point: {
                pixelSize: 10,
                color: $this.Cesium.Color.YELLOW,
            }
        });
        $this._entities_point.push(point);
        return point;
    }
 
    //创建曲线
    createCurveline() {
        var $this = this;
        var polyline = this.viewer.entities.add({
            polyline: {
                //使用cesium的peoperty
                positions: new $this.Cesium.CallbackProperty(function () {
                    return $this.fineBezier($this._positions);
                }, false),
                show: true,
                material: $this.Cesium.Color.RED,
                width: 3,
                clampToGround: true
            }
        });
        $this._entities_line.push(polyline);
        return polyline;
    }
 
    //销毁
    destroy() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
    }
 
    //清空实体对象
    clear() {
        for (var i = 0; i < this._entities_point.length; i++) {
            this.viewer.entities.remove(this._entities_point[i]);
        }
        for (var i = 0; i < this._entities_line.length; i++) {
            this.viewer.entities.remove(this._entities_line[i]);
        }
        this.floatingPoint = null;//标识点
        this._curveline = null; //活动曲线
        this._curvelineLast = null; //最后一条曲线
        this._positions = [];  //活动点
        this._entities_point = [];  //脏数据
        this._entities_line = [];  //脏数据
        this._curvelineData = null; //用于构造曲线数据
    }
 
    getCatesian3FromPX(px) {
        var cartesian;
        var ray = this.viewer.camera.getPickRay(px);
        if (!ray) return null;
        cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        return cartesian;
    }
 
    cartesianToLatlng(cartesian) {
        var latlng = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        var lat = this.Cesium.Math.toDegrees(latlng.latitude);
        var lng = this.Cesium.Math.toDegrees(latlng.longitude);
        return [lng, lat];
    }
 
    /贝塞尔曲线实现//
 
    fineBezier(points) {
        var $this = this;
        var pointNUM = 40; //个点
        var poins2D = [];
        var d = [];
        for (var i = 0; i < points.length; i++) {
            var res = $this.cartesianToLatlng(points[i]);
            var point = new Object();
            point.x = res[0];
            point.y = res[1];
            poins2D.push(point);
        }
        var cbs = $this.ComputeBezier(poins2D, pointNUM);
        for (var j = 0; j < cbs.length; j++) {
            d.push(cbs[j].x);
            d.push(cbs[j].y);
        }
        return $this.Cesium.Cartesian3.fromDegreesArray(d);
    }
 
    /*
 cp在此是四個元素的陣列:
 cp[0]為起始點，或上圖中的P0
 cp[1]為第一個控制點，或上圖中的P1
 cp[2]為第二個控制點，或上圖中的P2
 cp[3]為結束點，或上圖中的P3
 t為參數值，0 <= t <= 1
*/
    PointOnCubicBezier(cp, t) {
        var ax, bx, cx;
        var ay, by, cy;
        var tSquared, tCubed;
        var result = new Object();
        var length = cp.length;
        var inteval = Math.floor(length / 4);// 向下取整
        /*計算多項式係數*/
        cx = 3.0 * (cp[inteval].x - cp[0].x);
        bx = 3.0 * (cp[2 * inteval].x - cp[inteval].x) - cx;
        ax = cp[length - 1].x - cp[0].x - cx - bx;
        cy = 3.0 * (cp[inteval].y - cp[0].y);
        by = 3.0 * (cp[2 * inteval].y - cp[inteval].y) - cy;
        ay = cp[length - 1].y - cp[0].y - cy - by;
        /*計算位於參數值t的曲線點*/
        tSquared = t * t;
        tCubed = tSquared * t;
        result.x = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0].x;
        result.y = (ay * tCubed) + (by * tSquared) + (cy * t) + cp[0].y;
        return result;
    }
 
    /*
 ComputeBezier以控制點cp所產生的曲線點，填入Point2D結構的陣列。
 呼叫者必須分配足夠的記憶體以供輸出結果，其為<sizeof(Point2D) numberOfPoints>
*/
    ComputeBezier(cp, numberOfPoints) {
        var $this = this;
        var dt;
        var i;
        var curve = [];
        dt = 1.0 / (numberOfPoints - 1);
        for (i = 0; i < numberOfPoints; i++) {
            curve[i] = $this.PointOnCubicBezier(cp, i * dt);
        }
        return curve
    }
}
 
export default DrawCurve
```

# 四、圆

``` JS

/*
绘制圆
 */
class DrawCircle {
    constructor(arg) {
        this.viewer = arg.viewer;
        this.Cesium = arg.Cesium;
        this.callback=arg.callback;
        this._cicle = null; //活动圆
        this.floatingPoint = null;
        this._cicleLast = null; //最后一个圆
        this._positions = [];  //活动点
        this._entities_point = [];  //脏数据
        this._entities_cicle = [];  //脏数据
        this._cicleData = null; //用于构造圆形数据
    }
 
    get cicle() {
        return this._cicleLast;
    }
 
    //加载圆
    loadCicle(data) {
        var that = this;
        var position = data[0];
        var value = data;
        var r = Math.sqrt(
            Math.pow(value[0].x - value[value.length - 1].x, 2) +
            Math.pow(value[0].y - value[value.length - 1].y, 2)
        );
        var shape = this.viewer.entities.add({
            position: position,
            name: "circle",
            type: "circle",
            ellipse: {
                semiMinorAxis: r,
                semiMajorAxis: r,
                material: that.Cesium.Color.RED.withAlpha(0.5),
                outline: true
            }
        });
        return shape;
    }
 
    //返回数据
    getData() {
        return this._cicleData;
    }
 
    startCreate() {
        this.handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.viewer.scene.globe.depthTestAgainstTerrain = true;
        var $this = this;
        this.handler.setInputAction(function (evt) { //单机开始绘制
            $this.viewer.scene.globe.depthTestAgainstTerrain = true;
            //屏幕坐标转地形上坐标
            var cartesian = $this.getCatesian3FromPX(evt.position);
            if ($this._positions.length == 0) {
                $this._positions.push(cartesian.clone());
                $this.floatingPoint = $this.createPoint(cartesian);
            }
            if (!$this._cicle) {
                $this.createPoint(cartesian);// 绘制点
            }
            $this._positions.push(cartesian);
        }, $this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction(function (evt) { //移动时绘制圆
            if ($this._positions.length < 1) return;
            var cartesian = $this.viewer.scene.pickPosition(evt.endPosition);// $this.getCatesian3FromPX(evt.endPosition);
            if (!$this.Cesium.defined($this._cicle)) {
                $this._cicle = $this.createCicle();
            }
            $this.floatingPoint.position.setValue(cartesian);
            if ($this._cicle) {
                $this._positions.pop();
                $this._positions.push(cartesian);
            }
        }, $this.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction(function (evt) {
            if (!$this._cicle) return;
            $this.viewer.scene.globe.depthTestAgainstTerrain = false;
            var cartesian = $this.viewer.scene.pickPosition(evt.position); // $this.getCatesian3FromPX(evt.position);
            $this._positions.pop();
            $this._positions.push(cartesian);
            $this._cicleData = $this._positions.concat();
            $this.viewer.entities.remove($this._cicle); //移除
            $this._cicle = null;
            $this._positions = [];
            $this.floatingPoint.position.setValue(cartesian);
            var cicle = $this.loadCicle($this._cicleData); //加载
            $this._entities_cicle.push(cicle);
            $this._cicleLast = cicle;
            $this.clearPoint();
            if(typeof $this.callback=="function"){
                $this.callback(cicle);
            }
        }, $this.Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
 
    //创建圆
    createCicle() {
        var that = this;
        var shape = this.viewer.entities.add({
            position: that._positions[0],
            name: "circle",
            type: "circle",
            ellipse: {
                semiMinorAxis: new that.Cesium.CallbackProperty(function () {
                    //半径 两点间距离
                    var r = Math.sqrt(
                        Math.pow(that._positions[0].x - that._positions[that._positions.length - 1].x, 2) +
                        Math.pow(that._positions[0].y - that._positions[that._positions.length - 1].y, 2)
                    );
                    return r ? r : r + 1;
                }, false),
                semiMajorAxis: new that.Cesium.CallbackProperty(function () {
                    var r = Math.sqrt(
                        Math.pow(that._positions[0].x - that._positions[that._positions.length - 1].x, 2) +
                        Math.pow(that._positions[0].y - that._positions[that._positions.length - 1].y, 2)
                    );
                    return r ? r : r + 1;
                }, false),
                material: that.Cesium.Color.RED.withAlpha(0.5),
                outline: true
            }
        });
        that._entities_cicle.push(shape);
        return shape;
    }
 
    //创建点
    createPoint(cartesian) {
        var $this = this;
        var point = this.viewer.entities.add({
            position: cartesian,
            point: {
                pixelSize: 10,
                color: $this.Cesium.Color.YELLOW,
            }
        });;
        $this._entities_point.push(point);
        return point;
    }
 
    getCatesian3FromPX(px) {
        var cartesian;
        var ray = this.viewer.camera.getPickRay(px);
        if (!ray) return null;
        cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        return cartesian;
    }
 
    destroy() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
    }
 
    clearPoint(){
        for (var i = 0; i < this._entities_point.length; i++) {
            this.viewer.entities.remove(this._entities_point[i]);
        }
        this._entities_point = [];  //脏数据
    }
    clear() {
 
        for (var i = 0; i < this._entities_point.length; i++) {
            this.viewer.entities.remove(this._entities_point[i]);
        }
 
        for (var i = 0; i < this._entities_cicle.length; i++) {
            this.viewer.entities.remove(this._entities_cicle[i]);
        }
        this._cicle = null; //活动圆
        this.floatingPoint = null;
        this._cicleLast = null; //最后一个圆
        this._positions = [];  //活动点
        this._entities_point = [];  //脏数据
        this._entities_cicle = [];  //脏数据
        this._cicleData = null; //用于构造圆形数据
    }
}
 
export default DrawCircle
```

# 五、矩形

``` JS
// DrawCurve
/*
绘制矩形
 */
class DrawRectangle {
    constructor(arg) {
        this.viewer = arg.viewer;
        this.Cesium = arg.Cesium;
        this.callback=arg.callback;
        this.floatingPoint = null;//标识点
        this._rectangle = null; //活动矩形
        this._rectangleLast = null; //最后一个矩形
        this._positions = [];  //活动点
        this._entities_point = [];  //脏数据
        this._entities_rectangle = [];  //脏数据
        this._rectangleData = null; //用于构造矩形数据
    }
 
    //返回最后图形
    get line() {
        return this._rectangleLast;
    }
 
    //返回矩形数据
    getData() {
        return this._rectangleData;
    }
 
    //加载
    loadRectangle(data) {
        var $this = this;
        var shape = this.viewer.entities.add({
            name: "rectangle",
            rectangle: {
                coordinates: $this.Cesium.Rectangle.fromCartesianArray(data),
                material: $this.Cesium.Color.RED.withAlpha(0.5)
            }
        });
        $this._entities_rectangle.push(shape);
        return shape;
    }
 
    //开始创建
    startCreate() {
        var $this = this;
        this.handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction(function (evt) { //单机开始绘制
            //屏幕坐标转地形上坐标
            var cartesian = $this.getCatesian3FromPX(evt.position);
            if ($this._positions.length == 0) {
                $this._positions.push(cartesian.clone());
                $this.floatingPoint = $this.createPoint(cartesian);
                $this.createPoint(cartesian);// 绘制点
            }
            $this._positions.push(cartesian);
        }, $this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction(function (evt) { //移动时绘制线
            if ($this._positions.length < 3) return;
            var cartesian = $this.getCatesian3FromPX(evt.endPosition);
            if (!$this.Cesium.defined($this._rectangle)) {
                $this._rectangle = $this.createRectangle();
            }
            $this.floatingPoint.position.setValue(cartesian);
            if ($this._rectangle) {
                $this._positions.pop();
                $this._positions.push(cartesian);
            }
        }, $this.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction(function (evt) {
            if (!$this._rectangle) return;
            var cartesian = $this.getCatesian3FromPX(evt.position);
            $this._positions.pop();
            $this._positions.push(cartesian);
            $this.createPoint(cartesian);// 绘制点
            $this._rectangleData = $this._positions.concat();
            $this.viewer.entities.remove($this._rectangle); //移除
            $this._rectangle = null;
            $this._positions = [];
            $this.floatingPoint.position.setValue(cartesian);
            var rectangle = $this.loadRectangle($this._rectangleData); //加载
            $this._entities_rectangle.push(rectangle);
            $this._rectangleLast = rectangle;
            if(typeof $this.callback=="function"){
                $this.callback(rectangle);
            }
        }, $this.Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
 
    //创建点
    createPoint(cartesian) {
        var $this = this;
        var point = this.viewer.entities.add({
            position: cartesian,
            point: {
                pixelSize: 10,
                color: $this.Cesium.Color.YELLOW,
            }
        });
        $this._entities_point.push(point);
        return point;
    }
 
    //创建矩形
    createRectangle() {
        var $this = this;
        var shape = this.viewer.entities.add({
            name: "rectangle",
            rectangle: {
                coordinates: new $this.Cesium.CallbackProperty(function() {
                    var obj = $this.Cesium.Rectangle.fromCartesianArray($this._positions);
                    return obj;
                }, false),
                material: $this.Cesium.Color.RED.withAlpha(0.5)
            }
        });
        $this._entities_rectangle.push(shape);
        return shape;
    }
 
    //销毁
    destroy() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
    }
 
    //清空实体对象
    clear() {
        for (var i = 0; i < this._entities_point.length; i++) {
            this.viewer.entities.remove(this._entities_point[i]);
        }
        for (var i = 0; i < this._entities_rectangle.length; i++) {
            this.viewer.entities.remove(this._entities_rectangle[i]);
        }
        this.floatingPoint = null;//标识点
        this._rectangle = null; //活动矩形
        this._rectangleLast = null; //最后一个矩形
        this._positions = [];  //活动点
        this._entities_point = [];  //脏数据
        this._entities_rectangle = [];  //脏数据
        this._rectangleData = null; //用于构造矩形数据
    }
 
    getCatesian3FromPX(px) {
        var cartesian;
        var ray = this.viewer.camera.getPickRay(px);
        if (!ray) return null;
        cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        return cartesian;
    }
}
 
export default DrawRectangle
```

# 六、多边形

``` JS
// DrawPolygon
/*
绘制面
 */
class DrawPolygon {
    constructor(arg) {
        this.viewer = arg.viewer;
        this.Cesium = arg.Cesium;
        this.callback=arg.callback;
        this._polygon = null;  //活动面
        this._polygonLast = null;  //最后一个面
        this._positions = []; //活动点
        this._entities_point = [];  //脏数据
        this._entities_polygon = [];  //脏数据
        this._polygonData = null; //用户构造面
    }
 
    //返回最后活动面
    get polygon() {
        return this._polygonLast;
    }
 
    //返回面数据用于加载面
    getData() {
        return this._polygonData;
    }
 
    //加载面
    loadPolygon(data) {
        var $this = this;
        return this.viewer.entities.add({
            polygon: {
                hierarchy: new $this.Cesium.PolygonHierarchy(data),
                clampToGround: true,
                show: true,
                fill: true,
                material: $this.Cesium.Color.RED.withAlpha(0.5),
                width: 3,
                outlineColor: $this.Cesium.Color.BLACK,
                outlineWidth: 1,
                outline: false
            }
        });
    }
 
    //开始绘制
    startCreate() {
        var $this = this;
        this.handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction(function (evt) { //单机开始绘制
            var cartesian = $this.getCatesian3FromPX(evt.position);
            if ($this._positions.length == 0) {
                $this._positions.push(cartesian.clone());
            }
            $this.createPoint(cartesian);
            $this._positions.push(cartesian);
        }, $this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction(function (evt) { //移动时绘制面
            if ($this._positions.length < 1) return;
            var cartesian = $this.getCatesian3FromPX(evt.endPosition);
            if ($this._positions.length == 3) {
                if (!$this.Cesium.defined($this._polygon)) {
                    $this._polygon = $this.createPolygon();
                }
            }
            $this._positions.pop();
            $this._positions.push(cartesian);
        }, $this.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction(function (evt) {
            if (!$this._polygon) return;
            var cartesian = $this.getCatesian3FromPX(evt.position);
            $this._positions.pop();
            $this._positions.push(cartesian);
            $this.createPoint(cartesian);
            $this._polygonData = $this._positions.concat();
            $this.viewer.entities.remove($this._positions); //移除
            $this._positions=null;
            $this._positions = [];
            var Polygon = $this.loadPolygon($this._polygonData);
            $this._entities_polygon.push(Polygon);
            $this._polygonLast = Polygon;
            if(typeof $this.callback=="function"){
                $this.callback(Polygon);
            }
        }, $this.Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
 
    //创建面
    createPolygon() {
        var $this = this;
        var polygon = this.viewer.entities.add({
            polygon: {
                hierarchy: new $this.Cesium.CallbackProperty(function () {
                    return new $this.Cesium.PolygonHierarchy($this._positions);
                }, false),
                clampToGround: true,
                show: true,
                fill: true,
                material: $this.Cesium.Color.RED.withAlpha(0.5),
                width: 3,
                outlineColor: $this.Cesium.Color.BLACK,
                outlineWidth: 1,
                outline: false
            }
        });
        $this._entities_polygon.push(polygon);
        return polygon;
    }
 
    //创建点
    createPoint(cartesian) {
        var $this = this;
        var point = this.viewer.entities.add({
            position: cartesian,
            point: {
                pixelSize: 10,
                color: $this.Cesium.Color.YELLOW,
            }
        });
        $this._entities_point.push(point);
        return point;
    }
 
 
    //销毁事件
    destroy() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
    }
 
    //清空实体对象
    clear() {
        for (var i = 0; i < this._entities_point.length; i++) {
            this.viewer.entities.remove(this._entities_point[i]);
        }
        for (var i = 0; i < this._entities_polygon.length; i++) {
            this.viewer.entities.remove(this._entities_polygon[i]);
        }
        this._polygon = null;  //活动面
        this._polygonLast = null;  //最后一个面
        this._positions = []; //活动点
        this._entities_point = [];  //脏数据
        this._entities_polygon = [];  //脏数据
        this._polygonData = null; //用户构造面
    }
 
    getCatesian3FromPX(px) {
        var cartesian;
        var ray = this.viewer.camera.getPickRay(px);
        if (!ray) return null;
        cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        return cartesian;
    }
}
 
export default DrawPolygon
```

# 七、直线箭头

``` JS
// DrawstraightArrow
/*
绘制直线箭头
 */
class DrawstraightArrow {
    constructor(arg) {
        this.viewer = arg.viewer;
        this.Cesium = arg.Cesium;
        this.floatingPoint = null;//标识点
        this._straightArrow = null; //活动箭头
        this._straightArrowLast = null; //最后一个箭头
        this._positions = [];  //活动点
        this._entities_point = [];  //脏数据
        this._entities_straightArrow = [];  //脏数据
        this._straightArrowData = null; //用于构造箭头数据
    }
 
    //返回箭头
    get straightArrow() {
        return this._straightArrowLast;
    }
 
    //返回箭头数据用于加载箭头
    getData() {
        return this._straightArrowData;
    }
 
    //加载箭头
    loadStraightArrow(data) {
        var $this = this;
        if (data.length < 2) {
            return null;
        }
        var length = data.length;
        var p1 = data[0];
        var p2 = data[length - 1];
        var firstPoint = $this.cartesianToLatlng(p1);
        var endPoints = $this.cartesianToLatlng(p2);
        var arrow = [];
        var res = $this.fineArrow([firstPoint[0], firstPoint[1]], [endPoints[0], endPoints[1]]);
        for (var i = 0; i < res.length; i++) {
            var cart3 = new $this.Cesium.Cartesian3(res[i].x, res[i].y, res[i].z);
            arrow.push(cart3);
        }
        var arrowEntity = $this.viewer.entities.add({
            polygon: {
                hierarchy: new $this.Cesium.PolygonHierarchy(arrow),
                show: true,
                fill: true,
                clampToGround: true,
                material: $this.Cesium.Color.AQUA.withAlpha(0.5)
            }
        });
        return arrowEntity;
    }
 
    //开始创建
    startCreate() {
        var $this = this;
        this.handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction(function (evt) { //单机开始绘制
            //屏幕坐标转地形上坐标
            var cartesian = $this.getCatesian3FromPX(evt.position);
            if ($this._positions.length == 0) {
                $this._positions.push(cartesian.clone());
                $this.floatingPoint = $this.createPoint(cartesian);
            }
            if (!$this._straightArrow) {
                $this.createPoint(cartesian);// 绘制点
            }
            $this._positions.push(cartesian);
 
        }, $this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction(function (evt) { //移动时绘制面
            if ($this._positions.length < 2) return;
            var cartesian = $this.getCatesian3FromPX(evt.endPosition);
            if (!$this.Cesium.defined($this._straightArrow)) {
                $this._straightArrow = $this.createStraightArrow();
            }
            $this.floatingPoint.position.setValue(cartesian);
            if ($this._straightArrow) {
                $this._positions.pop();
                $this._positions.push(cartesian);
            }
        }, $this.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 
        this.handler.setInputAction(function (evt) {
            if (!$this._straightArrow) return;
            var cartesian = $this.getCatesian3FromPX(evt.position);
            $this._positions.pop();
            $this._positions.push(cartesian);
            $this._straightArrowData = $this._positions.concat();
            $this.viewer.entities.remove($this._straightArrow); //移除
            $this._straightArrow = null;
            $this._positions = [];
            $this.floatingPoint.position.setValue(cartesian);
            var straightArrow = $this.loadStraightArrow($this._straightArrowData); //加载
            $this._entities_straightArrow.push(straightArrow);
            $this._straightArrowLast = straightArrow;
            $this.clearPoint();
        }, $this.Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
 
    //创建直线箭头
    createStraightArrow() {
        var $this = this;
        var arrowEntity = $this.viewer.entities.add({
                polygon: {
                    hierarchy: new $this.Cesium.CallbackProperty(
                        function () {
                            // return new $this.Cesium.PolygonHierarchy($this._positions);
                            var length = $this._positions.length;
                            var p1 = $this._positions[0];
                            var p2 = $this._positions[length - 1];
                            var firstPoint = $this.cartesianToLatlng(p1);
                            var endPoints = $this.cartesianToLatlng(p2);
                            var arrow = [];
                            var res = $this.fineArrow([firstPoint[0], firstPoint[1]], [endPoints[0], endPoints[1]]);
                            for (var i = 0; i < res.length; i++) {
                                var cart3 = new $this.Cesium.Cartesian3(res[i].x, res[i].y, res[i].z);
                                arrow.push(cart3);
                            }
                            return new $this.Cesium.PolygonHierarchy(arrow);
 
                        }, false),
                    show: true,
                    fill: true,
                    clampToGround: true,
                    material: $this.Cesium.Color.AQUA.withAlpha(0.5)
                }
            }
        )
        $this._entities_straightArrow.push(arrowEntity);
        return arrowEntity
    }
 
    //创建点
    createPoint(cartesian) {
        var $this = this;
        var point = this.viewer.entities.add({
            position: cartesian,
            point: {
                pixelSize: 10,
                color: $this.Cesium.Color.YELLOW,
            }
        });
        $this._entities_point.push(point);
        return point;
    }
 
    cartesianToLatlng(cartesian) {
        var latlng = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        var lat = this.Cesium.Math.toDegrees(latlng.latitude);
        var lng = this.Cesium.Math.toDegrees(latlng.longitude);
        return [lng, lat];
    }
 
    //销毁
    destroy() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
    }
 
    clearPoint() {
        for (var i = 0; i < this._entities_point.length; i++) {
            this.viewer.entities.remove(this._entities_point[i]);
        }
        this._entities_point = [];  //脏数据
    }
 
    //清空实体对象
    clear() {
        for (var i = 0; i < this._entities_point.length; i++) {
            this.viewer.entities.remove(this._entities_point[i]);
        }
        for (var i = 0; i < this._entities_straightArrow.length; i++) {
            this.viewer.entities.remove(this._entities_straightArrow[i]);
        }
 
        this.floatingPoint = null;//标识点
        this._straightArrow = null; //活动箭头
        this._straightArrowLast = null; //最后一个箭头
        this._positions = [];  //活动点
        this._entities_point = [];  //脏数据
        this._entities_straightArrow = [];  //脏数据
        this._straightArrowData = null; //用于构造箭头数据
    }
 
    getCatesian3FromPX(px) {
        var cartesian;
        var ray = this.viewer.camera.getPickRay(px);
        if (!ray) return null;
        cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        return cartesian;
    }
 
    求取箭头坐标函数/
    //箭头配置函数
    fineArrowDefualParam() {
        return {
            tailWidthFactor: 0.15,
            neckWidthFactor: 0.20,
            headWidthFactor: 0.25,
            headAngle: Math.PI / 8.5,
            neckAngle: Math.PI / 13
        }
    }
 
    fineArrow(tailPoint, headerPoint) {
        var $this = this;
        if ((tailPoint.length < 2) || (headerPoint.length < 2)) return;
        //画箭头的函数
        let tailWidthFactor = $this.fineArrowDefualParam().tailWidthFactor;
        let neckWidthFactor = $this.fineArrowDefualParam().neckWidthFactor;
        let headWidthFactor = $this.fineArrowDefualParam().headWidthFactor;
        let headAngle = $this.fineArrowDefualParam().headAngle;
        let neckAngle = $this.fineArrowDefualParam().neckAngle;
        var o = [];
        o[0] = tailPoint;
        o[1] = headerPoint;
        var e = o[0],
            r = o[1],
            n = $this.getBaseLength(o),
            g = n * tailWidthFactor,
            //尾部宽度因子
            i = n * neckWidthFactor,
            //脖子宽度银子
            s = n * headWidthFactor,
            //头部宽度因子
            a = $this.getThirdPoint(r, e, Math.PI / 2, g, !0),
            l = $this.getThirdPoint(r, e, Math.PI / 2, g, !1),
            u = $this.getThirdPoint(e, r, headAngle, s, !1),
            c = $this.getThirdPoint(e, r, headAngle, s, !0),
            p = $this.getThirdPoint(e, r, neckAngle, i, !1),
            h = $this.getThirdPoint(e, r, neckAngle, i, !0),
            d = [];
        d.push(a[0], a[1], p[0], p[1], u[0], u[1], r[0], r[1], c[0], c[1], h[0], h[1], l[0], l[1], e[0], e[1]);
        return $this.Cesium.Cartesian3.fromDegreesArray(d);
    }
 
    getBaseLength(t) {
        return Math.pow(this.wholeDistance(t), .99)
    }
 
    wholeDistance(t) {
        for (var o = 0, e = 0; e < t.length - 1; e++) o += this.distance(t[e], t[e + 1]);
        return o
    }
 
    distance(t, o) {
        return Math.sqrt(Math.pow(t[0] - o[0], 2) + Math.pow(t[1] - o[1], 2))
    }
 
    getThirdPoint(t, o, e, r, n) {
        var g = this.getAzimuth(t, o),
            i = n ? g + e : g - e,
            s = r * Math.cos(i),
            a = r * Math.sin(i);
        return [o[0] + s, o[1] + a]
    }
 
    getAzimuth(t, o) {
        var e, r = Math.asin(Math.abs(o[1] - t[1]) / this.distance(t, o));
        return o[1] >= t[1] && o[0] >= t[0] ? e = r + Math.PI : o[1] >= t[1] && o[0] < t[0] ? e = 2 * Math.PI - r : o[1] < t[1] && o[0] < t[0] ? e = r : o[1] < t[1] && o[0] >= t[0] && (e = Math.PI - r), e
    }
}
 
export default DrawstraightArrow
```

# 效果图

http://wayla.gitee.io/compage/cesium

需要自己点绘