多重采样抗锯齿

指定采样次数 4 次（其他次数不知道为什么不支持）
在创建 pipeline 中指定 MultiSampleState
创建一个 texture，用来重采样
将 renderPassDescriptor 中 colorAttachments 中的 attachment 设为此 texture 的 view
将 renderPassDescriptor 中 colorAttachments 中的 resolveTarget 设为交换链的 texture 的 view

重点就是 renderPassDescriptor.colorAttachments.attachment 和 resolveTarget 的设置
个人理解，resolveTarget 就是最终要输出的，attachment 是中间的（类似于FBO？）