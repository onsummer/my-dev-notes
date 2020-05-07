# mongoose链接数据库

``` JS
const mongoose = require('mongoose')

await mongoose.connect('mongodb://localhost/my_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

```

更多用法见：https://github.com/Automattic/mongoose

# mongo库连接数据库

https://mongodb.github.io/node-mongodb-native/3.0/tutorials

这是官方`mongo`库的帮助文档

# GridFS

https://www.cnblogs.com/vipzhou/p/6905125.html

要使用`mongoose`、`gridfs-stream`和`fs`三个node库。

但是`gridfs-stream`库已经5年没有更新了，官方推荐使用新的库。

``` JS
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://127.0.0.1/test');
var conn = mongoose.connection;
  
var fs = require('fs');
 
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
  
conn.once('open', function () {
  console.log('open');
  var gfs = Grid(conn.db);
 
  // 写文件
  var writestream = gfs.createWriteStream({
      filename: 'mongo_file.txt'
  });
  fs.createReadStream('./local.txt').pipe(writestream);
 
  writestream.on('close', function (file) {
    console.log(file.filename + ' Written To DB');
  });
 
  var fs_write_stream = fs.createWriteStream('./write.txt');
  
  // 读取文件
  var readstream = gfs.createReadStream({
      filename: 'mongo_file.txt'
  });
  readstream.pipe(fs_write_stream);
  fs_write_stream.on('close', function () {
      console.log('file has been written fully!');
  });
 
  // 根据文件名称
  gfs.remove({filename: 'mongo_file.txt'}, function (err) {
    if (err) return handleError(err);
    console.log('success');
  });
 
  // 根据fs.files._id删除
  gfs.remove({_id : '548d91dce08d1a082a7e6d96'}, function (err) {
    if (err) return handleError(err);
    console.log('success');
  });
 
  // 判断文件是否存在
  var options = {filename : 'mongo_file.txt'}; // 使用_id也可以
  gfs.exist(options, function (err, found) {
    if (err) return handleError(err);
    found ? console.log('File exists') : console.log('File does not exist');
  });
 
  // 获取文件基础信息
  gfs.files.find({ filename: 'mongo_file.txt' }).toArray(function (err, files) {
    if (err) {
      throw (err);
    }
    console.log(files);
  });
});
```

# mongo+gridfs

这个是官方的用法，见https://mongodb.github.io/node-mongodb-native/3.0/tutorials/gridfs/streaming/

``` JS
const fs = require('fs')
const mongodb = require('mongodb')
const assert = require('assert')

const uri = `mongodb://localhost:27017`
const dbName = `yes`

mongodb.MongoClient.connect(uri, { useUnifiedTopology: true }, function(error, client) {
    assert.ifError(error)

    const db = client.db(dbName)
    let bucket = new mongodb.GridFSBucket(db)

    fs.createReadStream(`C:/Users/C/Desktop/广州白膜.zip`)
        .pipe(bucket.openUploadStream(`广州白膜`))
        .on('error', err => {assert.ifError(error)})
        .on('finish', () => {console.log('done.'); process.exit(0);})
})
```

这里使用了mongodb.GridFSBucket类。

`fs.createReadStream()`后，通过`pipe()`将文件流传递给``mongodb.GridFSBucket`的`openUploadStream()`来传递文件。