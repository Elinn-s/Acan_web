# Acan 资料站（结构化版本）

当前已按“先导页 + 三个功能页独立”的方式整理，便于后续迭代。

## 目录结构

- `src/pages/landing/`：先导页（入口视觉与引导）
- `src/pages/display/`：展示页（总览与快速入口）
- `src/pages/text/`：文字模块页
- `src/pages/image/`：图片模块页
- `src/pages/video/`：视频模块页
- `src/shared/styles/`：共享样式（tokens/base/page-shell）
- `src/shared/js/content-service.js`：共享数据读取与转义工具
- `src/data/mock.json`：演示数据源（图片/视频 URL 在这里）

## 入口说明

- 根入口：`/` -> `src/` -> 自动跳转到 `src/pages/landing/`
- 先导页：`/src/pages/landing/`
- 展示页：`/src/pages/display/`
- 文字页：`/src/pages/text/`
- 图片页：`/src/pages/image/`
- 视频页：`/src/pages/video/`