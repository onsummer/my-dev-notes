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

