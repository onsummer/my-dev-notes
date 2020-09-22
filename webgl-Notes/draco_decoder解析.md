draco_decoder

# 1. 读取文件头

先将字节全部读取，等价 File.ReadAllBytes()

将这段字节用于初始化一个 DecoderBuffer对象，此处用的是 Init方法

``` C#
var bytes = File.ReadAllBytes(@"...");
var decoderBuffer = new DecoderBuffer();
decoderBuffer.Init(bytes);
```

随后，根据这个 decoderBuffer 对象，调用一个函数 `draco::Decoder::GetEncodedGeometryType()` 返回一个状态对象（`draco.StatusOr<EncodedGeometryType>`）

实际上，这个函数内部是解析了 decoderBuffer 的 `DracoHeader`，即文件头。

``` C#
class DracoHeader
{
    /// <summary>
    /// "DRACO"
    /// </summary>
    public string DracoString { get; internal set; }

    public byte VersionMajor { get; internal set; }
    public byte VersionMinor { get; internal set; }
    public byte EncoderType { get; internal set; }
    public byte EncoderMethod { get; internal set; }
    public ushort Flags { get; internal set; }
}
```

这个文件头的长度是 6 + 1 * 4 + 2 = 12 字节（字符串还要算上结尾的0）。

# 2. 大致思路

读全部字节→读12字节文件头→返回状态\<T\>对象，判断ok和geometryType→解码，获取mesh（索引）和pc（坐标）→obj_encoder写入obj文件