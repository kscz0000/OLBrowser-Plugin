# 图像处理工具箱 - 浏览器插件

这是一个集成了图像压缩和SVG转图片功能的浏览器插件，提供便捷的图像处理工具。

## 功能特性

### 1. 图像压缩
- 支持多种格式：PNG、JPG/JPEG、WebP
- 10级压缩强度控制
- 批量处理
- 实时预览压缩前后对比
- 并行处理提高效率
- 本地处理保护隐私

### 2. SVG转图片
- 支持拖拽上传或直接粘贴SVG代码
- 输出格式：PNG、JPG
- 可调节图片质量（1-10级）
- 可调节缩放比例（0.5x-3x）
- 实时预览转换结果

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
├── popup.html             # 主弹出窗口
├── popup.js               # 主弹出窗口逻辑
├── popup.css              # 主弹出窗口样式
├── image-compressor.html  # 图像压缩应用
├── image-compressor.js    # 图像压缩逻辑
├── image-compressor.css   # 图像压缩样式
├── svg-converter.html     # SVG转图片应用
├── svg-converter.js       # SVG转图片逻辑
├── svg-converter.css      # SVG转图片样式
├── shared-styles.css      # 共享样式
├── icons/                 # 图标目录
├── test.html              # 测试页面
└── README.md              # 说明文档
```

### 图标生成
插件需要以下尺寸的图标：
- 16x16px (icon16.png)
- 32x32px (icon32.png)
- 48x48px (icon48.png)
- 128x128px (icon128.png)

可以使用 `icons/icon.svg` 作为基础，通过在线工具或图像编辑软件转换为所需尺寸的PNG文件。

## 测试

使用 `test.html` 文件可以在浏览器中预览插件界面，但由于CORS限制，某些功能可能无法完全正常工作。最佳测试方法是通过浏览器扩展程序加载插件。

## 许可证

MIT License