way 1:

``` js
/* 程序启动时获取时间 */
window.last = new Date().getTime()

function render() {
  /* 循环时获取执行时间 */
  const currentTime = new Date().getTime() 
  /* 若当前时间与上次时间差小于 1000 ms，退出 */
  if (currentTime - window.last > 1000) {
    console.log('msg')
    window.last = currentTime
  } 

  requestAnimationFrame(render)
}

render()
```



way 2:

``` js
/* 程序启动时的时间 */
window.last = 0
function render(time) {
  /* 若当前时间与上次时间差小于 1000 ms，退出 */
  if (time - window.last > 1000) {
    console.log('msg')
    window.last = time
  } 
  requestAnimationFrame(render)
}
render()
```

