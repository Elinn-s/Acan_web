# Acan

一个可交互的书架。每本书是一册写真集：鼠标碰到会抬起并泛白光，点开后书本被取出、翻开，书架退到背景变暗。

## 本地预览

双击 `start.bat`，浏览器会打开 `http://localhost:5500/`。

站点用了 ES module 和 fetch，**必须走 http**，直接双击 `web/index.html` 打不开。

## 目录结构

```
web/
  index.html
  css/    base / shelf / reader —— 分别是全局、书架、翻开后的书
  js/     loader 读数据 · shelf 书架 · reader 取书与翻页 · templates 版式
  data/books/<书名>/
    images/      书里的图片
    config/style.js   这本书的造型实现（书脊、封面、配色、版式序列）
    info.txt     四行：标题 / 发行时间 / 简介 / 备注
  data/books/manifest.json   书目清单，加书要在这里登记
  tools/gen-placeholders.js  占位图生成器
  server.js     零依赖静态服务器
```

## 加一本书

1. 在 `web/data/books/` 新建文件夹，照现有书复制 `images/`、`config/`、`info.txt`。
2. 把书名加进 `manifest.json` 的 `books` 数组，顺序就是书架上从左到右的顺序。
3. 改 `info.txt` 四行内容。**备注那行支持链接**，写成 `[文字](网址)` 或直接贴网址，在扉页上可以点。
4. 改 `config/style.js`——这本书长什么样全在这个文件里。

## config/style.js 能改什么

| 字段 | 作用 |
| --- | --- |
| `form` | 书的体量。`height` 相对书架内高，`thickness`（厚度）和 `width`（宽度）相对书本自身高度 |
| `spineMode` | `vertical` 中文竖排书脊，`rotate` 西文旋转书脊 |
| `theme` | 一组 CSS 变量：封面/书脊底色、书口、白光颜色、内页纸色与字色、字体、字距 |
| `spineArt()` / `coverArt()` | 返回 SVG 字符串，作为书脊和封面的图案层（标题文字由程序叠在上面） |
| `pages` | 扉页之后的内容页序列 |

`pages` 可用的版式：

- `full` 整版出血图 + 压字说明
- `plate` 留白图版，带编号和图注
- `caption` 上图下文
- `quote` 语录页，`text` 里用 `\n` 换行
- `duo` 双图上下排
- `grid3` 一大两小
- `colophon` 结尾版权页

图片用 `img: 0` 或 `imgs: [3, 4]` 指定，数字是 `images` 数组的下标。

## 换掉占位图

`web/data/books/*/images/` 目前是脚本生成的 SVG 占位图。放真照片进去后，把文件名填回该书 `config/style.js` 的 `images` 数组即可（顺序决定 `pages` 里的下标）。

重新生成占位图：`node web/tools/gen-placeholders.js`

## uv 环境

Python 部分暂未与网站关联，保留着 uv 的骨架：

```bash
uv sync          # 按 uv.lock 同步环境
uv run main.py
```
