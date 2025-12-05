# 贡献指南

感谢您对 OLBrowser Plugin 项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 报告 bug
- 提交修复
- 添加新功能
- 改进文档
- 提出建议

## 行为准则

请遵守我们的[行为准则](CODE_OF_CONDUCT.md)，共同营造一个友好的社区环境。

## 开发流程

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 代码规范

### JavaScript
- 使用原生 JavaScript，避免引入不必要的依赖
- 遵循函数式编程原则
- 保持代码简洁和可读性
- 添加适当的注释

### CSS
- 使用语义化的类名
- 遵循 BEM 命名约定
- 使用 CSS 变量进行主题管理

### HTML
- 使用语义化标签
- 保持良好的可访问性

## 项目结构

```
image-processor-extension/
├── manifest.json           # 插件清单文件
├── index.html             # 主弹出窗口
├── main.js                # 主弹出窗口逻辑
├── styles.css             # 主弹出窗口样式
├── image-compressor/      # 图像压缩应用目录
│   ├── index.html         # 图像压缩主界面
│   ├── refactored-main.js # 图像压缩逻辑
│   └── style-refactored.css # 图像压缩样式
├── svg-converter/         # SVG转图片应用目录
│   ├── index.html         # SVG转换主界面
│   ├── svg-converter.js   # SVG转换逻辑
│   └── svg-converter.css  # SVG转换样式
├── shared/                # 共享资源目录
│   ├── redirect.js        # 重定向功能
│   └── return-btn.js      # 返回按钮功能
├── lib/                   # 第三方库目录
│   └── browser-image-compression.js # 图像压缩库
├── icons/                 # 图标目录
└── README.md              # 说明文档
```

## Pull Request 规范

1. 确保 PR 有清晰的标题和描述
2. 一个 PR 只解决一个问题
3. 添加相关测试（如适用）
4. 确保所有测试通过
5. 更新相关文档

## 报告 Bug

请使用 GitHub Issues 模板来报告 bug，并提供以下信息：

- 问题的清晰描述
- 复现步骤
- 预期行为
- 实际行为
- 浏览器版本和操作系统
- 屏幕截图（如有）

## 提出功能建议

我们欢迎新功能建议！请在 GitHub Issues 中创建一个功能请求，包括：

- 功能的详细描述
- 解决的问题
- 可能的实现方案
- 替代方案

## 代码审查

所有提交的 PR 都会经过代码审查过程。审查者会关注：

- 代码质量和可读性
- 功能正确性
- 性能影响
- 安全性
- 可维护性

## 许可证

通过贡献代码，您同意您的贡献将遵循项目的 MIT 许可证。

### 第三方库许可证

本项目使用了以下第三方库：

1. **browser-image-compression** - 用于图像压缩功能
   - 版本：v2.0.2
   - 许可证：MIT License
   - 作者：Donald <donaldcwl@gmail.com>
   - 项目地址：[https://github.com/Donaldcwl/browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)
   - 许可证文本：本库采用 MIT 许可证，允许在本项目中使用、复制、修改、合并、发布、分发、再许可和/或销售软件副本。