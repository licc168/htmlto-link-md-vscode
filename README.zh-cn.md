# Markdown 一键分享 / 文档转网页

将 Markdown 一键分享为精美网页，由 [htmlto.link](https://htmlto.link) 托管。

---

## 快速开始

1. **打开** 任意 `.md` 文件  
2. **点击** 编辑器右上角的地球图标，或在资源管理器中右键文件 → **「分享」**  
3. **选择模板**（部分模板可再选主题），点击 **分享**  
4. **复制链接**，发给任何人即可在浏览器阅读  

> 🖼️ **本地图片支持**：文档中引用的本地图片（支持标准相对路径及 Wiki 语法）会在分享时自动上传并替换为在线 URL，智能缓存避免重复上传。

### 操作演示

![Quick Markdown Share 演示](https://image.albumshare.cn/hmltolink/htmlto-link-md-vscode/demo.gif?v=0.1.13)

---

## 游客 vs Token

| 模式 | 说明 |
|------|------|
| **游客**（默认） | 无需注册，链接约 **24 小时** 后过期 |
| **Token** | 在 [htmlto.link](https://htmlto.link) 注册后，于 [设置页](https://htmlto.link/settings) 复制 Token；分享绑定账号，便于长期保存与更新 |

在分享面板顶部可查看当前模式，并 **设置 / 清除 Token**，或打开设置页获取 Token。  
也可通过命令面板执行 **「Markdown 一键分享: 打开 Token 设置」**。

---

## 命令

| 命令 | 说明 |
|------|------|
| `Markdown 一键分享: 分享` | 打开分享面板 |
| `Markdown 一键分享: 删除当前文件的分享` | 删除当前文件的分享 |
| `Markdown 一键分享: 打开 Token 设置` | 设置或清除 Token（留空即清除） |

---

## 更新与删除

- **更新**：对同一文件再次分享，会更新已有链接内容（面板会提示「已分享」）。  
- **删除**：命令面板 → `删除当前文件的分享`。  

---

## 设置

| 配置项 | 默认 | 说明 |
|--------|------|------|
| `htmlToLinkMd.apiBaseUrl` | `https://htmlto.link` | API 地址（一般无需修改） |
| `htmlToLinkMd.defaultTemplate` | `plain` | 默认模板 |
| `htmlToLinkMd.autoCopyUrl` | `true` | 成功后自动复制链接 |
| `htmlToLinkMd.openInBrowser` | `false` | 成功后在浏览器打开 |
| `htmlToLinkMd.uploadLocalImages` | `true` | 是否在分享时自动上传 Markdown 中引用的本地图片 |

Token 保存在 VS Code Secret Storage，不会写入工作区文件。

---

## 首次使用提示

安装后首次激活会显示简短说明；首次打开分享面板时也会有 3 步引导。关闭后不再打扰。

分享面板右上角另有 **中文 / EN** 切换，仅影响面板界面（与本详情页语言无关）。

---

## 相关

- 网站：[https://htmlto.link](https://htmlto.link)  
- HTML 站点发布扩展：可搜索 **HTML 一键部署 / 静态网站发布**（文件夹部署）  

---

## License

MIT
