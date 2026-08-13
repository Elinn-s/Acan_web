# Acan

uv 管理的 Python 项目骨架。

## 目录结构

- `pyproject.toml`：项目与依赖声明
- `uv.lock`：锁定的依赖版本
- `.python-version`：项目使用的 Python 版本
- `.venv/`：uv 创建的虚拟环境（不纳入版本控制）
- `main.py`：入口示例
- `web/data/`：保留的图片素材

## 使用

```bash
uv sync          # 按 uv.lock 同步环境
uv run main.py   # 在环境中运行
uv add <包名>     # 添加依赖
```
