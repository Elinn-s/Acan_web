# Acan 资料站

## 目录结构

- `main.py` / `pyproject.toml` / `uv.lock`：uv 管理的 Python 环境（暂未与网站部分关联）
- `start.bat`：双击启动本地开发服务器并打开网站
- `web/`：网站全部内容
  - `index.html`：首页（泡泡导航 + 人物立绘）
  - `config.js`：首页背景图/立绘等可改配置
  - `css/`、`js/`：首页样式与脚本
  - `data/landing/`：首页用的背景图、立绘图片
  - `data/gallery/<分类>/`：图片资料站的图片，按分类放文件夹
  - `modules/gallery/`：图片资料站模块（分类 tab + 灯箱）
    - 加完图片后运行 `node web/modules/gallery/gen-manifest.js` 生成 `manifest.json`；
      该脚本还会自动把伪装成 `.jpg` 的 HEIC（iPhone 照片常见问题）转换成真正的 JPEG
  - `server.js`：零依赖本地静态服务器，供 `start.bat` 调用
  - `package.json`：目前唯一依赖 `heic-convert`，用于上面的自动转码

## 本地预览

双击根目录的 `start.bat`，会自动启动服务器并打开浏览器访问 `http://localhost:5500/`。
