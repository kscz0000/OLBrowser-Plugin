# 贡献指南

感谢您对图像处理工具箱项目的关注！我们欢迎任何形式的贡献，包括但不限于：报告 Bug、提出功能建议、优化代码、改进文档等。

## 如何贡献

### 1. 报告 Bug

如果您发现了 Bug，请：

1. 检查 [Issues](https://github.com/kscz0000/OLBrowser-Plugin/issues) 是否已有相关报告
2. 如果没有，创建新的 Issue
3. 在 Issue 标题中清晰描述 Bug（例如：「图像压缩失败，错误信息 XXX」）
4. 在 Issue 正文中提供：
   - Bug 的详细描述
   - 重现步骤
   - 预期行为
   - 实际行为
   - 浏览器和操作系统信息
   - 相关截图（如适用）
5. 使用合适的 Issue 标签（例如：bug, image-compressor 等）

### 2. 提出新功能建议

如果您有新的功能想法：

1. 先在 [Issues](https://github.com/kscz0000/OLBrowser-Plugin/issues) 搜索是否已有相关讨论
2. 如果没有，创建新的 Feature Request
3. 在 Issue 中详细描述：
   - 功能描述和用途
   - 使用场景示例
   - 可能的实现方案（如有）
   - 相关的 Issue 或 Pull Request
4. 使用合适的标签（例如：enhancement, feature-request 等）

### 3. 提交代码更改

如果您想直接修改代码：

1. Fork 本仓库到您的 GitHub 账户
2. 创建新的功能分支（例如：`git checkout -b feature/amazing-feature`）
3. 进行您的修改
4. 确保代码符合项目的代码规范
5. 提交更改（`git commit -m 'Add amazing feature'`）
6. 推送到您的 Fork（`git push origin feature/amazing-feature`）
7. 在 GitHub 上创建 Pull Request

### 4. 改进文档

如果您发现文档可以改进：

1. 找到相关的文档文件
2. 直接在 GitHub 上编辑文件（点击文件右上角的铅笔图标）
3. 或者按照"如何贡献"流程提交 PR

---

## 开发环境设置

### 克隆仓库

```bash
# 克隆仓库
git clone https://github.com/kscz0000/OLBrowser-Plugin.git

# 进入项目目录
cd OLBrowser-Plugin
```

### 安装依赖

本项目使用纯原生 JavaScript，无需安装额外的 npm 包或依赖。

### 项目结构

```
OLBrowser-Plugin/
├── manifest.json              # 插件清单文件
├── background.js              # 后台服务脚本
├── index.html                 # 主入口页面
├── main.js                    # 主页面逻辑
├── styles.css                 # 主样式表
├── icons/                    # 图标资源
├── image-compressor/           # 图像压缩模块
├── svg-converter/             # SVG 转换模块
├── shared/                    # 共享模块
├── lib/                       # 第三方库
└── docs/                      # 项目文档
```

---

## 代码规范

### JavaScript 规范

- 使用 ES6+ 语法
- 使用 `const` 和 `let` 代替 `var`
- 使用箭头函数
- 使用模板字符串（反引号）
- 避免全局变量污染

### 命名规范

- 变量使用驼峰命名（`camelCase`）
- 常量使用全大写下划线（`UPPER_SNAKE_CASE`）
- 函数使用驼峰命名（`camelCase`）
- 私有属性使用下划线（`_privateProperty`）

### 注释规范

- 复杂逻辑需要添加注释
- 使用 JSDoc 风格的函数注释
- 关键决策需要在提交信息中说明

### 格式化

- 使用 4 空格缩进（空格，非 Tab）
- 每行最大长度建议不超过 100 字符
- 函数之间留一个空行

---

## 提交规范

### Commit 信息格式

使用语义化的提交信息：

```
<类型>(<范围>): <简短描述>

<详细描述>（可选）

关联 Issue：#<issue 编号>
```

**类型**：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链配置

**示例**：
```
feat(compressor): 添加 PPTX 文件自动提取图片功能

修复了图像压缩模块中处理 PPTX 文件时的 Bug，现在可以自动提取演示文稿中的所有图片。

关联 Issue：#42
```

---

## Pull Request 规范

### PR 标题

遵循 Commit 信息格式：
```
<类型>(<范围>): <简短描述>
```

### PR 描述

1. 清晰描述 PR 的目的
2. 列出相关的 Issue（如有）
3. 描述主要的更改内容
4. 提供相关的截图（如适用）
5. 确保所有测试通过

### 代码审查

所有 PR 都需要经过代码审查：
- 确保代码风格一致
- 检查是否有明显的 Bug
- 验证功能正常工作
- 确保文档已更新

### 小的 PR

小的 PR（例如：拼写修复、文档改进）可以直接合并。

### 大的 PR

大的 PR 应该拆分为多个小的 PR，每个 PR 专注于一个功能或修复。

---

## 测试

在提交 PR 之前：

1. 测试您的更改：
   - 在不同浏览器中测试（Chrome、Edge、Firefox 等）
   - 测试所有受影响的功能
   - 确保没有引入新的 Bug

2. 手动测试：
   - 加载插件到浏览器
   - 测试核心功能流程
   - 检查控制台是否有错误

---

## 文档更新

如果您的更改影响了用户可见的功能：

1. 更新相关的文档
2. 确保 README.md 中的信息准确
3. 添加必要的注释到代码中
4. 更新 CHANGELOG.md（如有新功能或重大修复）

---

## 发布流程

只有项目维护者可以执行发布：

1. 更新版本号（manifest.json）
2. 更新 CHANGELOG.md
3. 创建 Git 标签（`git tag v1.x.x`）
4. 推送到 GitHub
5. 创建 GitHub Release

---

## 行为准则

- **尊重和包容**：尊重所有贡献者，包容不同观点
- **建设性讨论**：在 Issue 和 PR 中保持礼貌和建设性
- **专注于项目的目标**：讨论和贡献应该有助于项目发展
- **接受反馈**：愿意接受和整合他人的反馈

---

## 获取帮助

如果您有任何问题或需要帮助：

1. 查看 [项目文档](README.md)
2. 查看 [现有 Issues](https://github.com/kscz0000/OLBrowser-Plugin/issues)
3. 创建新的 Issue 提问问题

---

再次感谢您的贡献！🎉
