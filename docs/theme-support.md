# 主题切换功能说明

## 功能概述

本插件支持三种主题模式：
1. **浅色主题 (Light Theme)** - 经典明亮界面
2. **深色主题 (Dark Theme)** - 深色界面，减少眼部疲劳
3. **跟随系统主题 (Follow System Theme)** - 自动匹配操作系统主题设置

## 实现原理

### CSS变量管理
主题切换通过CSS变量实现，不同主题模式下使用不同的颜色变量值。

### 持久化存储
用户主题偏好设置通过`localStorage`进行持久化存储，页面刷新后自动应用上次选择的主题。

### 系统主题监听
当选择"跟随系统"模式时，插件会监听操作系统的主题变化，并自动切换界面主题。

## 技术细节

### 文件结构
- `shared/theme-switch.css` - 主题切换器样式文件
- `shared/theme-switch.js` - 主题切换核心逻辑文件

### 核心API
- `ThemeSwitch.getCurrentTheme()` - 获取当前主题设置
- `ThemeSwitch.switchTheme(theme)` - 切换主题

### 主题属性
主题通过`data-theme`属性应用到`<html>`元素上：
- 浅色主题: `<html data-theme="light">`
- 深色主题: `<html data-theme="dark">`

## 无障碍支持

- 支持键盘导航切换主题
- 提供屏幕阅读器友好的图标和文本
- 遵循系统减少动画偏好设置

## 响应式设计

主题切换器会自动适配不同屏幕尺寸，确保在各种设备上都有良好的用户体验。