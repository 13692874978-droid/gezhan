# 个人站点

一个可以直接部署到 GitHub Pages 的纯静态个人站点。无构建步骤，根目录已经包含 `index.html`，上传整个目录即可运行。

## 本地预览

直接双击 `index.html` 即可打开。若浏览器限制部分线上接口或 CDN 脚本，可以在目录里启动本地服务器：

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 内容编辑

主要内容集中在：

- `data/content.js`：姓名、简介、项目、文章、视频、联系方式、文字球词表。
- `assets/images/`：项目封面、关于区和视频兜底图片。
- `css/style.css`：视觉样式与响应式布局。

## 视频说明

视频区使用 `data/content.js` 里的 B 站 BV 号生成三列卡片。页面会尝试从 B 站公开接口读取真实标题和封面；如果本地 `file://` 环境下接口受限，会显示站内兜底图片和 BV 号，点击仍会跳转到对应视频。

部署到 GitHub Pages 后，视频标题和封面通常会更稳定地自动补全。

## 目录结构

```text
.
├── index.html
├── css/
│   └── style.css
├── data/
│   └── content.js
├── js/
│   ├── main.js
│   ├── menu.js
│   ├── render.js
│   ├── scroll.js
│   └── sphere.js
├── assets/
│   └── images/
├── .nojekyll
├── .gitignore
└── README.md
```

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库。
2. 把本目录下的所有文件上传到仓库根目录。
3. 保留 `.nojekyll` 文件。
4. 进入仓库 `Settings -> Pages`。
5. Source 选择 `Deploy from a branch`，分支选择 `main`，目录选择 `/root`。
6. 等待 GitHub Pages 发布完成。

所有资源都使用相对路径，部署在 `username.github.io/repo-name/` 这类子路径下也能正常加载。
