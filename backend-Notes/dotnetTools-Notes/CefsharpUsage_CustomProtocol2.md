使用CefSharp访问页面但不经过 HttpServer

原文：[点我](https://bbonczek.github.io/jekyll/update/2018/04/24/serve-content-in-cef-without-http-server.html)

4.24 2018

有两个方法，但是如果你仅仅想快速解决问题，建议你看 `custom file protocol`。

# 1 为什么不推荐用 `file:///` 协议

如果你读到这里，我猜你已经试过 `file://` 协议而且报错了 —— css 样式和 图片都不起作用。为什么？

归因于安全，chromium 内核会作限制。

假设你有这样的结构：

``` 
|- dist
    |- index.html
    |- bundle.js
    |- vendors.js
    |- styles.css
    |- assets
        |- arrow.svg
        |- start.svg
        |- stop.svg
```

在你的 `index.html` 你请求了一张svg 图：

``` HTML
...
<p>image from assets requested below:</p>
<img src="images/arrow.svg"/>
...
```

图并没有渲染出来，反而会报错：

`XMLHttpRequest cannot load file:///.../images/arrow.svg. Cross origin requests are only supported for HTTP.`

Chromium 不允许加载不同来源的文件，至少，在这里文件夹就不同。

即便是 `index.html`，其相对路径的子文件夹也是不同源的。有关这个问题请看：[this chromium issue](https://bugs.chromium.org/p/chromium/issues/detail?id=47416)

# 为什么不要用 `--allow-file-access-from-files` 

理由很简单，就是不安全，通过浏览器可以任意访问磁盘文件，这很危险。

假设你存了一张图，这是你的密码截图：

``` HTML
...
<p>下面的图将被请求</p>
<img src="../../very-important-stuff-inside/passwords.png"/>
...
```

你看，你的密码就暴露了。

所以，祭出解决方案：

# `custom file protocol`

Cefsharp 允许你指定自定义协议，来满足响应不同的请求。

现在，我们想创建类似于 `file:///` 协议的自定义协议，以便处理整个项目目录树中的文件。

`CustomProtocolSchemeHandler.cs`

``` C#
using System;
using System.IO;
using CefSharp;

namespace MyProject.CustomProtocol
{
    public class CustomProtocolSchemeHandler: ResourceHandler
    {
        private string frontendFolderPath;
        public CustomProtocolSchemeHandler()
        {
            frontendFolderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "./bundle/");
        }

        // 处理请求以及做出响应
        public override bool ProcessRequestAsync(IRequest request, ICallback callback) 
        {
            var uri = new Uri(request.Url);
            var fileName = uri.AbsolutePath;

            var requestedFilePath = frontendFolderPath + fileName;
            var isAccesToFilePermitted = IsRequestedPathInsideFolder(
                new DirectoryInfo(requestedFilePath),
                new DirectoryInfo(frontendFolderPath)
            );

            if (isAccesToFilePermitted && File.Exists(requestedFilePath))
            {
                byte[] bytes = File.ReadAllBytes(requestedFilePath);
                Stream = new MemoryStream(bytes);

                var fileExtension = Path.GetExtension(fileName);
                MimeType = GetMimeType(fileExtension);

                callback.Continue();
                return true;
            }

            callback.Dispose();
            return false;
        }
    
        public bool IsRequestedPathInsideFolder(DirectoryInfo path, DirectoryInfo folder)
        {
            if (path.Parent == null)
            {
                return false;
            }

            if (string.Equals(path.Parent.FullName, folder.FullName, StringComparison.InvariantCultureIgnoreCase))
            {
                return true;
            }

            return IsRequestedPathInsideFolder(path.Parent, folder);
        }
    }
    
}
```

`CustomProtocolSchemeHandlerFactory.cs`

``` C#
using CefSharp;

namespace MyProject.ExtendedFileProtocol
{
    public class CustomProtocolSchemeHandlerFactory: ISchemeHandlerFactory
    {
        public const string SchemeName = "customFileProtocol";
        
        public IResourceHandler Create(IBrowser browser, IFrame frame, string schemeName, IRequest request)
        {
            return new CustomProtocolSchemeHandler();
        }
    }
}
```

现在，在你的 `Cef.Initialize(...)` 代码中添加以下内容：

``` C#
var settings = new CefSettings
{
    BrowserSubprocessPath = GetCefExecutablePath()
};

settings.RegisterScheme(new CefCustomScheme{
    SchemeName = CustomProtocolSchemeHandlerFactory.SchemeName,
    SchemeHandlerFactory = new CustomProtocolSchemeHandlerFactory()
});

Cef.Initialize(settings);
browser = new ChromiumWebBrowser("customfileprotocol:\\<文件夹>\\index.html");
```

