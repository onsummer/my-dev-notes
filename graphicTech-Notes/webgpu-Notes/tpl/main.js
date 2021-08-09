async function render() {
  if (!navigator.gpu) {
    alert('你的浏览器不支持 WebGPU 或未开启 WebGPU 支持')
    return
  }
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter

  
}

render()