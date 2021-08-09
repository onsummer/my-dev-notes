``` JS
function setTilesetOpacity(tileset, opacity) {
  const style = new Cesium.Cesium3DTileStyle({
    color: {
      evaluateColor: (feature, result) => new Cesium.Color(1, 1, 1, opacity)
    },
    show: false,
  })
  tileset.style = style
}
```

