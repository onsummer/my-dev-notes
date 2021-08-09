# WinForm中使用 v65 的 `FolderSchemeHandlerFactory`

``` C#
public partial class Form1 : Form
{
    InitializeComponent();
    InitBrowser();
}

public ChromiumWebBrowser browser;

public void InitBrowser()
{
    var settings = new CefSettings();

    settings.RegisterScheme(new CefCustomScheme
    {
        SchemeName = "localfolder",
        DomainName = "cefsharp",
        SchemeHandlerFactory = new FolderSchemeHandlerFactory(
            rootFolder: @"C:\CEFSharpExample\webpage",
            hostName: "cefsharp",
            defaultPage: "index.html" // will default to index.html
        )
    });

    Cef.Initialize(settings);

    browser = new ChromiumWebBrowser("localfolder://cefsharp/");

    this.Controls.Add(browser);
    browser.Dock = DockStyle.Fill;   
}
```

 