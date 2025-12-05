# OLBrowser Plugin - 图像处理工具箱

[![License](https://img.shields.io/github/license/kscz0000/OLBrowser-Plugin)](https://github.com/kscz0000/OLBrowser-Plugin/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/kscz0000/OLBrowser-Plugin)](https://github.com/kscz0000/OLBrowser-Plugin/issues)
[![GitHub stars](https://img.shields.io/github/stars/kscz0000/OLBrowser-Plugin)](https://github.com/kscz0000/OLBrowser-Plugin/stargazers)

这是一个集成了图像压缩和SVG转图片功能的浏览器插件，提供便捷的本地图像处理工具。

## 功能特性

### 1. 图像压缩
- 支持多种格式：PNG、JPG/JPEG、WebP、GIF、BMP
- 1-100级压缩强度控制
- 批量处理
- 压缩结果对比显示
- 并行处理提高效率
- 本地处理保护隐私

### 2. SVG转图片
- 支持拖拽上传或直接粘贴SVG代码
- 输出格式：PNG、JPG
- 批量转换为 PNG / JPG 格式
- 自定义输出尺寸（1x-4x）与质量（1-10级）
- 完全离线运行无需联网

## 安装方法

### 在Chrome中安装
1. 下载或克隆此项目
2. 打开Chrome浏览器
3. 访问 `chrome://extensions/`
4. 开启右上角的"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择 `image-processor-extension` 文件夹
7. 插件将出现在浏览器工具栏中

### 在其他基于Chromium的浏览器中安装
- Edge: 访问 `edge://extensions/`
- Opera: 访问 `opera://extensions/`
- 其他Chromium浏览器：类似路径

## 使用方法

1. 点击浏览器工具栏中的插件图标
2. 在初始界面选择要使用的功能：
   - **图像压缩**：压缩图片文件
   - **SVG转图片**：将SVG转换为PNG或JPG

### 图像压缩功能
1. 拖拽图片到上传区域或点击选择文件
2. 调节压缩级别（1-10，数值越高压缩率越高）
3. 点击"压缩"按钮
4. 压缩完成后点击"下载"保存压缩后的图片

### SVG转图片功能
1. 拖拽SVG文件到上传区域或点击选择文件
2. 或者直接在文本框中粘贴SVG代码
3. 选择输出格式（PNG或JPG）
4. 调节图片质量和缩放比例
5. 点击"转换"按钮
6. 转换完成后点击"下载"保存结果

## 技术实现

- 使用原生JavaScript实现，无需额外依赖
- 利用Canvas API进行图像处理
- 使用FileReader API读取文件
- 通过Blob和URL.createObjectURL实现文件下载
- 响应式设计，适配不同尺寸的弹出窗口

## 隐私说明

- 所有处理都在本地完成，不会上传任何数据到服务器
- 插件不收集用户个人信息
- 不需要网络连接即可正常工作

## 开发说明

### 项目结构
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

### 图标生成
插件需要以下尺寸的图标：
- 16x16px (icon16.png)
- 32x32px (icon32.png)
- 48x48px (icon48.png)
- 128x128px (icon128.png)

可以使用 `icons/icon.svg` 作为基础，通过在线工具或图像编辑软件转换为所需尺寸的PNG文件。

## 贡献

欢迎任何形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目开发。

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

### 第三方库

本项目使用了以下第三方库：

1. **browser-image-compression** - 用于图像压缩功能
   - 版本：v2.0.2
   - 许可证：MIT License
   - 作者：Donald <donaldcwl@gmail.com>
   - 项目地址：[https://github.com/Donaldcwl/browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)