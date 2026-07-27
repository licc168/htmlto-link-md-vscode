# 🚀 Markdown 本地图片上传测试文档

这是一份用于测试 `htmlto-link-md-vscode` 插件**自动上传本地图片并重写链接**功能的测试文档。

---

## 🖼️ 1. 标准 Markdown 图片语法测试

以下是通过标准相对路径引用的本地图片：

![测试科技插图](./sample.png)

---

## 📝 2. Wiki 链接语法测试

以下是通过 Wiki 格式引用的本地图片：

![[sample.png|Wiki 语法测试图片]]

---

## 🌟 功能说明

分享此文档时，插件将自动：
1. 识别上面的 `sample.png` 本地图片。
2. 将图片发送至 `https://htmlto.link/api/assets` 存储。
3. 自动将图片地址替换为在线 `https://` 链接后再生成分享页面。
