官方在NodeJs的驱动程序中提供了对GridFS进行访问的API，需要结合NodeJs的fs模块使用。

在3.6版本的驱动中，使用`.pipe()`方法把文件流传递给mongodb。

# 上传文件

下列示例展示了如何把`meistersinger.mp3`文件（位于项目根目录下）传给GridFS。啥文件都可以，不拘泥于mp3文件。

为了使用GridFS API，需要先创建一个`GridFSBucket`对象。

``` js
const client = new mongodb.MongoClient(uri)
client.connect(function(err) {
    const db = client.db(dbName)
    
    let bucket = new mongodb.GridFSBucket(db)
    // ...
})
```

这个`bucket`对象拥有一个`openUploadStream()`方法，它能创建一个上传的文件流，并与给定路径的文件进行数据传输（当然这里就是指上传）。

可以通过NodeJS的fs模块内的`pipe`——管道技术，先用fs读取文件流，然后通过这个`pipe`，把读取到的文件流传递给bucket.openUploadStream()开的上传文件流。

``` JS
const uri = 'mongodb://localhost:27017';
const dbName = 'test';
const client = new mongodb.MongoClient(uri);

client.connect(function(error) {
    const db = client.db(dbName);

    let bucket = new mongodb.GridFSBucket(db);

    fs.createReadStream('./meistersinger.mp3')
        .pipe(bucket.openUploadStream('meistersinger.mp3'))
});
```

假设你的`test`数据库是空的，那么一顿操作后，test数据库会多出两个集合：`fs.files`和`fs.chunks`。前者存储文件的元数据：

``` SHELL
> db.fs.files.findOne()
{
	"_id" : ObjectId("561fc381e81346c82d6397bb"),
	"length" : 27847575,
	"chunkSize" : 261120,
	"uploadDate" : ISODate("2020-05-15T15:17:21.819Z"),
	"md5" : "2459f1cdec4d9af39117c3424326d5e5",
	"filename" : "meistersinger.mp3"
}
```

上述查询到的文档指示文件名是"meistersinger.mp3"，并且告诉你文件大小是27847575bytes，啥时候上传的，还有md5值。这里的chunkSize是指整个文件按这个大小（261120bytes，即255kb）切割，255kb是默认值。

``` SHELL
> db.fs.chunks.count()
107
```

别惊讶。length/chunkSize约为106.6，意思是切成了107个块。每个块的文档长这样：

``` SHELL
> db.fs.chunks.findOne({}, { data: 0 })
{
	"_id" : ObjectId("561fc381e81346c82d6397bc"),
	"files_id" : ObjectId("561fc381e81346c82d6397bb"),
	"n" : 0
}
```

块的文档记录了它属于哪个文件、是第几个块。它还有一个数据属性没有列出。

`fs.files`和`fs.chunks`的`fs`前缀、块大小均可更改：

``` JS
const bucket = new mongodb.GridFSBucket(db, {
  chunkSizeBytes: 1024,
  bucketName: 'songs'
})
```

那么，前缀就变成了`songs`，切割粒度为1kb

# 下载文件

文件蹲在GridFS是没什么卵用的。

此时，需要通过下载流来把文件传输到本地硬盘中：

``` JS
const bucket = new mongodb.GridFSBucket(db)

bucket.openDownloadStreamByName('meistersinger.mp3')
	.pipe(fs.createWriteStream('./output.mp3'))
```

这样就在程序运行的同级别目录下创建了`output.mp3`文件了。

与fs.createReadStream().pipe(\*)不同，下载操作则是GridFSBucket.openDownloadStreamByName().pipe(\*)

前者是fs本地创建流后开管道(pipe)，向GridFSBucket流传输数据。

后者是GridFSBucket服务器创建流后开管道(pipe)，向fs流传输数据。

下载文件的时候可以做一些切割操作：

``` JS
bucket.openDownloadStreamByName('meistersinger.mp3')
    .start(1024 * 1585) // <-- 跳过前1585KB，约41秒
    .pipe(fs.createWriteStream('./output.mp3'))
```

> 注意：无法对一个chunk进行再切割（其实是不建议），因为255kb已经够小了。