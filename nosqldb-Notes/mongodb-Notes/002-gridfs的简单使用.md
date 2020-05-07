# 使用mongofiles命令

mongofiles位于安装路径的bin目录下，所以要配置环境变量才可以直接使用。

官方参考文档：https://docs.mongodb.com/manual/reference/program/mongofiles/

基本用法：

``` shell
mongofiles <options> <commands> <filename>
```



## 导入文件（put）

``` shell
mongofiles [-d <数据库名>] put <文件路径>
```

若不指定数据库，则放到test数据库下。

## 列出文件（list）

``` shell
mongofiles [-d <数据库名>] list
```

若要列出以字符串sss开头的文件，则

``` SHELL
mongofiles [-d <数据库名>] list sss
```



## 获取文件（get/get_id）

``` shell
mongofiles [-d <数据库名>] get <文件名>
```

```shell
mongofiles [-d <数据库名>] get_id 'ObjectId("56feac751f417d0357e7140f")'
```

get_id后必须是单引号，id必须用双引号引起来。

get命令执行结果是在当前工作环境下，创建一个与文件名完全一样的文件。

**如果文件名是带绝对路径的，则在绝对路径下创建一样名字的文件。**

如果不带后缀名，默认创建无后缀名的文件。

若要放到别的路径去，则使用二级选项--local：

``` SHELL
mongofiles [-d <数据库名>] [--local <别的路径>] get <文件名>
```

## 删除文件

``` SHELL
mongofiles [-d <数据库名>] delete <文件名>
```

## 指定端口或主机名

``` shell
mongofiles --port <端口号> ...
```

``` SHELL
mongofiles --host=db1.example.net --port=37017 ...
```

## 搜索文件（search）

``` SHELL
mongofiles [-d <数据库名>] search corinth
```

意思是搜索文件名中带"corinth"的文件

# 改变集合的`fs`前缀

使用nodejs下的`mongo`库：

``` JS
const bucket = new mongodb.GridFSBucket(db, {
  chunkSizeBytes: 1024,
  bucketName: 'songs'
});

fs.createReadStream('./meistersinger.mp3').
  pipe(bucket.openUploadStream('meistersinger.mp3')).
  on('error', function(error) {
    assert.ifError(error);
  }).
  on('finish', function() {
    console.log('done!');
    process.exit(0);
  });
```

指定GridFSBucket的`bucketName`属性即可。

# 使用nodejs`mongo`库下载文件

保存到GridFS还没什么用，要下载下来才有用。

``` JS
const bucket = new mongodb.GridFSBucket(db, {
  chunkSizeBytes: 1024,
  bucketName: 'songs'
});

bucket.openDownloadStreamByName('meistersinger.mp3').
  pipe(fs.createWriteStream('./output.mp3')).
  on('error', function(error) {
    assert.ifError(error);
  }).
  on('finish', function() {
    console.log('done!');
    process.exit(0);
  });
```

