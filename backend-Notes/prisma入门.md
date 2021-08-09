在一个 nodejs 后端项目中，你会怎么访问数据库的数据？通常来说，你会打开官方文档，看看有没有合适的包，或者在搜索引擎里搜有没有更好的第三方实现，然后根据实际用到的数据库进行设计、编程。

为了效率，你可能会用到 orm 技术。

现在，我打算介绍的是一个 orm 库，它号称是下一代的 orm 框架：`prisma`

#  ts+pg 为例

## 先决条件

安装了 nodejs 12 以上

安装并正确运行本机 postgresql

## 创建并安装依赖

```sh
npm init -y
npm i prisma typescript ts-node @types/node -D
```

## 创建 ts 配置文件：tsconfig.json

``` json
{
  "compilerOptions": {
    "sourceMap": true,
    "outDir": "dist",
    "strict": true,
    "lib": ["esnext"],
    "esModuleInterop": true
  }
}
```

## 初始化 prisma 环境

``` sh
npx prisma init
```

这一步会创建 `prisma/schema.prisma` 文件，以及 `.env` 文件，并提前写入了一些配置。

### prisma 文件



### .env 文件

设置了 pg 的连接 url

``` env
DATABASE_URL = 'postgresql://username:password@localhost:5432/databasename?schema=public'
```



## 使用 prisma 迁移工具

这一步是从 prisma 文件生成合适的 SQL 文件



## 使用客户端进行代码编写

``` sh
npm i @prisma/client
```

待一切就绪后，用这句安装命令即可进行适配安装客户端

如果你的 `prisma` 文件有更新，可以用这句命令更新客户端库程序：

``` sh
prisma generate
```

接下来就可以正式写客户端代码了

``` typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	// 代码待会要写在这
}

main()
	.catch(e => {
  	throw e
	})
	.finally(async () => {
  	await prisma.$disconnect()
	})
```

上述即基本套路，创建一个客户端，并在一个异步函数中编写 orm 查询语句，并执行它。

下面，给 main 函数添加点类似 `hello world` 一样的代码：

``` typescript
async function main() {
  const allUsers = await prisma.user.findMany()
  console.log(allUsers)
}
```

编写代码的时候智能提示会适配 `prisma/schema.prisma` 文件中写的 model 及其字段

然后运行此代码：

``` sh
npx ts-node index.ts
```

不出意外的话，在控制台会打印出空数组（因为啥数据都没创建）：

``` sh
[]
```

### 向数据库插入一些数据

``` typescript
async function main() {
  await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@prisma.io',
      posts: {
        create: { title: 'Hello World' },
      },
      profile: {
        create: { bio: 'I like turtles' },
      },
    },
  })

  const allUsers = await prisma.user.findMany({
    include: {
      posts: true,
      profile: true,
    },
  })
  console.dir(allUsers, { depth: null })
}
```

会输出：

``` json
[
  {
    email: 'alice@prisma.io',
    id: 1,
    name: 'Alice',
    posts: [
      {
        content: null,
        createdAt: 2020-03-21T16:45:01.246Z,
        id: 1,
        published: false,
        title: 'Hello World',
        authorId: 1,
      }
    ],
    profile: {
      bio: 'I like turtles',
      id: 1,
      userId: 1,
    }
  }
]
```

此时，使用 GUI 程序去查询上述三个表，会发现成功插入了数据。

### 过滤 title 字段包括 `'prisma'` 的所有 Post 记录

``` typescript
// 写在 async 函数内
const filteredPosts = await prisma.post.findMany({
  where: {
    OR: [
      { title: { contains: 'prisma'} },
      { content: { contains: 'prisma'} },
    ]
  }
})
```

### 创建一个 user 并附带 post

``` typescript
// 写在 async 函数内
const user = await prisma.user.create({
  data: {
    name: 'Alice',
    email: 'alice@prisma.io',
    posts: {
      create: {
        title: 'Join us for Prisma Day 2020.'
      }
    }
  }
})
```

### 更新一条 post 记录

``` typescript
// 写在 async 函数内
const post = await prisma.post.update({
  where: { id: 42 },
  data: { published: true }
})
```



# 接下来：学习例子

- [REST API 例子](https://github.com/prisma/prisma-examples/tree/latest/typescript/rest-express) 使用 express + prisma 创建了一个 rest 风格的 api 示例程序

