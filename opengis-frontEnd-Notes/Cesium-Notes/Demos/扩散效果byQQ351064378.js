const circleScan = (viewer, options) => {
  var cartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(options.position.lng), Cesium.Math.toRadians(options.position.lat), options.position.alt)
  return addCircleScanPostStage(viewer, cartographicCenter, options.radius, options.color, options.duration)
}

/*
	 添加扩散效果扫描线
	 viewer
	 cartographicCenter 扫描中心
	 radius  半径 米
	 scanColor 扫描颜色
	 duration 持续时间 毫秒
	 id 唯一id
 */
function addCircleScanPostStage (viewer, cartographicCenter, maxRadius, scanColor, duration, id) {
  var _Cartesian3Center = Cesium.Cartographic.toCartesian(cartographicCenter)
  var _Cartesian4Center = new Cesium.Cartesian4(_Cartesian3Center.x, _Cartesian3Center.y, _Cartesian3Center.z, 1)

  var _CartograhpicCenter1 = new Cesium.Cartographic(cartographicCenter.longitude, cartographicCenter.latitude, cartographicCenter.height + 500)
  var _Cartesian3Center1 = Cesium.Cartographic.toCartesian(_CartograhpicCenter1)
  var _Cartesian4Center1 = new Cesium.Cartesian4(_Cartesian3Center1.x, _Cartesian3Center1.y, _Cartesian3Center1.z, 1)

  var _time = (new Date()).getTime()

  var _scratchCartesian4Center = new Cesium.Cartesian4()
  var _scratchCartesian4Center1 = new Cesium.Cartesian4()
  var _scratchCartesian3Normal = new Cesium.Cartesian3()

  var ScanPostStage = new Cesium.PostProcessStage({
    name: id,
    fragmentShader: getScanSegmentShader(),
    uniforms: {
      u_scanCenterEC: function () {
        var temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center)
        return temp
      },
      u_scanPlaneNormalEC: function () {
        var temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center)
        var temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1)

        _scratchCartesian3Normal.x = temp1.x - temp.x
        _scratchCartesian3Normal.y = temp1.y - temp.y
        _scratchCartesian3Normal.z = temp1.z - temp.z

        Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal)

        return _scratchCartesian3Normal
      },
      u_radius: function () {
        return maxRadius * (((new Date()).getTime() - _time) % duration) / duration
      },
      u_scanColor: scanColor
    }
  })

  return ScanPostStage
}

// 扩散效果Shader
function getScanSegmentShader () {
  var scanSegmentShader = '\n\
                    uniform sampler2D colorTexture;\n\
                    uniform sampler2D depthTexture;\n\
                    varying vec2 v_textureCoordinates;\n\
                    uniform vec4 u_scanCenterEC;\n\
                    uniform vec3 u_scanPlaneNormalEC;\n\
                    uniform float u_radius;\n\
                    uniform vec4 u_scanColor;\n\
                    \n\
                    vec4 toEye(in vec2 uv,in float depth)\n\
                    {\n\
                                vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));\n\
                                vec4 posIncamera = czm_inverseProjection * vec4(xy,depth,1.0);\n\
                                posIncamera = posIncamera/posIncamera.w;\n\
                                return posIncamera;\n\
                    }\n\
                    \n\
                    vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point)\n\
                    {\n\
                                vec3 v01 = point - planeOrigin;\n\
                                float d = dot(planeNormal,v01);\n\
                                return (point-planeNormal * d);\n\
                    }\n\
                    float getDepth(in vec4 depth)\n\
                    {\n\
                                float z_window = czm_unpackDepth(depth);\n\
                                z_window = czm_reverseLogDepth(z_window);\n\
                                float n_range = czm_depthRange.near;\n\
                                float f_range = czm_depthRange.far;\n\
                                return (2.0 * z_window - n_range - f_range)/(f_range-n_range);\n\
                    } \n\
                    void main()\n\
                    {\n\
                                gl_FragColor = texture2D(colorTexture,v_textureCoordinates);\n\
                                float depth = getDepth(texture2D(depthTexture,v_textureCoordinates));\n\
                                vec4 viewPos = toEye(v_textureCoordinates,depth);\n\
                                vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz,u_scanCenterEC.xyz,viewPos.xyz);\n\
                                float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);\n\
                                if(dis<u_radius)\n\
                                {\n\
                                    float f = 1.0-abs(u_radius - dis )/ u_radius;\n\
                                    f = pow(f,4.0);\n\
                                    gl_FragColor = mix(gl_FragColor,u_scanColor,f);\n\
                                }\n\
                    } \n\ '
  return scanSegmentShader
}
export default circleScan
