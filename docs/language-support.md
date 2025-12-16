# 多语言支持说明

## 功能概述

本图像处理工具箱支持中英文双语切换，用户可以在任何页面的右上角找到语言切换浮框，点击即可在中文和英文之间切换。

## 实现原理

### 1. 语言切换浮框
- 位置：固定在页面右上角
- 样式：现代化设计，与页面整体风格一致
- 功能：点击可展开语言选择菜单

### 2. 语言配置
- 默认语言：中文 (zh)
- 支持语言：中文 (zh)、英文 (en)
- 语言存储：使用 localStorage 保存用户选择

### 3. 翻译机制
- 静态文本翻译：页面加载时自动翻译所有静态文本
- 动态文本翻译：对通过JavaScript动态添加的文本进行实时翻译
- 属性翻译：支持 placeholder、title、aria-label 等属性的翻译

## 文件结构

```
shared/
├── language-switch.css    # 语言切换浮框样式
├── language-switch.js     # 语言切换核心逻辑
└── language-support.md    # 语言支持说明文档
```

## 集成方式

### 1. CSS引入
在每个需要语言切换功能的HTML页面的`<head>`部分添加：
```html
<link rel="stylesheet" href="../shared/language-switch.css">
```

### 2. JS引入
在每个需要语言切换功能的HTML页面的`</body>`标签前添加：
```html
<script src="../shared/language-switch.js"></script>
```

## 扩展支持其他语言

### 1. 添加新语言配置
在 `language-switch.js` 的 `languages` 对象中添加新语言：
```javascript
const languages = {
  'zh': {
    name: '中文',
    flag: '🇨🇳'
  },
  'en': {
    name: 'English',
    flag: '🇺🇸'
  },
  // 添加新语言
  'ja': {
    name: '日本語',
    flag: '🇯🇵'
  }
};
```

### 2. 添加翻译文本
在 `translations` 对象中为每个需要翻译的文本添加新语言的翻译：
```javascript
'图像处理工具箱': {
  'en': 'Image Processing Toolbox',
  'ja': '画像処理ツールボックス'
}
```

## 注意事项

1. 翻译文本需要精确匹配原文，包括空格和标点符号
2. 新增页面需要按照集成方式添加CSS和JS文件
3. 动态生成的文本需要手动调用翻译函数
4. 页面标题的翻译需要特殊处理

## 技术细节

### 1. 文本节点翻译
使用递归遍历DOM树的方式查找并翻译文本节点。

### 2. 属性翻译
支持翻译常见HTML属性，如 placeholder、title、aria-label 等。

### 3. 性能优化
- 使用缓存机制避免重复翻译
- 仅在语言切换时重新遍历DOM
- 使用事件委托减少内存占用