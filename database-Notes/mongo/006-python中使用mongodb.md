使用pymongo库。

# GridFS的使用

``` PYTHON
from pymongo import MongoClient
import gridfs
conn = MongoClient('localhost',27017)
db = conn.db_grid
fs = gridfs.GridFS(db)
cursor = fs.find()
for file in cursor:
    if file.filename = 'AI.tar.gz':
        with open(file.filename,'wb') as f:
            while True:
                data = file.read()
                if not data:
                    break
                f.write(data)
conn.close()
```

# 文档

https://pymongo.readthedocs.io/en/stable/api/gridfs/index.html#module-gridfs

# 示例代码

https://pymongo.readthedocs.io/en/stable/examples/gridfs.html