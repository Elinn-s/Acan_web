# Acan

Acan 是一个以电子书柜形式整理和浏览杂志影像的响应式静态网站。

书柜按日期从早到晚陈列杂志；打开一本杂志后，可以查看刊物信息、封面、正片和花絮，
并通过大图查看器缩放、拖动浏览图片。项目使用原生 HTML、CSS 和 JavaScript，站点运行时
没有第三方依赖。

## 功能

- 响应式电子书柜，根据屏幕宽度自动调整每行数量
- 杂志按日期从早到晚排列，封面下方显示标题和日期
- 桌面端详情采用左侧封面、右侧信息与图片网格布局
- 移动端详情自动切换为单列布局
- 支持标题、简介、备注以及 Markdown/裸链接跳转
- 图片按“封面 → 二封 → 正片 → 花絮”的顺序展示
- 所有图片使用 `object-fit: contain` 完整呈现，不裁切内容
- 电脑端支持滚轮缩放、鼠标拖动和双击复原
- 触屏端支持双指缩放和单指拖动
- 支持大图前后切换、键盘方向键和 `Esc` 关闭

## 本地预览

双击根目录中的 `start.bat`，浏览器会自动打开：

```text
http://localhost:5500/
```

也可以手动启动：

```bash
node web/server.js
```

当前页面入口不依赖 ES module 或运行时 `fetch`，因此直接打开 `web/index.html` 也能浏览；
推荐使用本地服务器，以获得与部署环境一致的路径和缓存行为。

## 项目结构

```text
Acan_web/
├─ start.bat                  # Windows 一键启动
├─ web/
│  ├─ index.html              # 页面入口
│  ├─ server.js               # 零依赖本地静态服务器
│  ├─ assets/                 # 站点静态资源
│  ├─ css/                    # 基础、书柜、详情与大图样式
│  ├─ js/
│  │  └─ app.js               # 当前生效的全部页面逻辑与书目配置
│  ├─ data/
│  │  ├─ magazine/            # 本地原始素材，不进入 Git
│  │  └─ magazines/           # 构建后的 WebP 与元数据，进入 Git
│  └─ tools/
│     └─ build-magazines.js   # 原图处理与元数据生成脚本
└─ README.md
```

`web/js/main.js`、`loader.js`、`reader.js`、`shelf.js` 等文件属于此前的模块化实现，
目前未被 `index.html` 引用。继续开发时以 `web/js/app.js` 为准。

## 素材格式

每本杂志的原始素材放在：

```text
web/data/magazine/<YYYYMMDD 名称>/
```

文件夹名必须以日期开头，日期用于确定书柜顺序。

| 文件 | 用途 |
| --- | --- |
| `1.jpg` | 主封面，也是书柜封面 |
| `2.jpg` | 可选二封 |
| `名称 (1).jpg`、`名称 (2).jpg` | 正片，按括号中的数字排序 |
| `幕后1.jpg` 等其他名称 | 花絮，由构建脚本自动归组 |
| `<杂志标题>.txt` | 刊物标题及文字信息 |

文字文件使用以下四行格式：

```text
标题：CHIC八月大片
时间：2026.08.12
简介：这个夏天，她想带着……
备注：实体刊，AB封，6张小卡
```

`.txt` 文件名作为书柜上的杂志标题。文字内容支持 `[文字](网址)` 和直接书写
`https://...` 两种链接格式。

## 构建图片

原图体积较大，不直接进入仓库。构建脚本使用 `sharp` 生成适合网页读取的 WebP、
缩略封面和 `meta.json`。

首次使用：

```bash
cd web/tools
npm install
npm run build
```

只重新构建某一本杂志：

```bash
node build-magazines.js CHIC
```

生成结果位于 `web/data/magazines/`。原始目录 `web/data/magazine/` 已被 `.gitignore`
排除。

## 添加或更新杂志

1. 按素材格式把原图和 `.txt` 放入 `web/data/magazine/`。
2. 运行图片构建脚本。
3. 检查生成目录中的 `meta.json` 和 `skipped` 字段。
4. 在 `web/js/app.js` 顶部的 `CATALOG` 中新增或更新对应书目。
5. 启动网站，检查书柜顺序、详情图片数量、链接和大图交互。

当前页面使用 `app.js` 中的内置 `CATALOG`，不会在运行时扫描原图目录或读取
`manifest.json`。这样可以直接打开静态页面，但新杂志构建完成后需要同步更新
`CATALOG`。

## 图源

所有页面图片统一经过 `web/js/app.js` 中的 `imageSource()`：

```js
function imageSource(file) {
  return file?.source || PLACEHOLDER;
}
```

当前图源指向 `web/data/magazines/` 下的 WebP 构建产物。书柜、详情网格和大图查看器
共用这个入口；以后需要切换图片规格或 CDN 时，只修改该函数即可。

## 当前内容与验证状态

仓库目前收录 6 本杂志，共配置 102 张封面和内页图片。

已验证：

- 6 张书柜封面均可正确加载并按日期排序
- CHIC 详情显示 21 张网格图片：2 张封面、16 张正片、3 张花絮
- CHIC 左侧封面、详情网格和大图图源均可正常解码
- 备注及外部链接正常
- 桌面端和 390px 窄屏布局正常
- 页面控制台无错误

## 已知素材问题

构建时无法处理的文件会打印到终端，并写入对应 `meta.json` 的 `skipped` 字段。

- `20260811CHIC/大片.mp4`：视频暂未接入站点
- `20260811CHIC/预告.jpg`：文件实际使用 HEIF 编码，需要重新导出为标准 JPG
- `20260811CHIC/CHIC (3).jpg`：源文件缺失，编号从 2 跳到 4

大图查看器当前读取 WebP 构建产物，而不是约 740 MB 的原始素材。若未来部署需要更高
清晰度，建议单独生成高清档或接入对象存储/CDN，而不是把全部原图提交到仓库。

## 技术说明

- 前端：原生 HTML、CSS、JavaScript
- 运行时依赖：无
- 本地服务器：Node.js 内置 `http` 模块
- 图片构建：Node.js + `sharp`
- Python/uv 文件目前只是仓库骨架，未参与网站运行
