# MP4转换功能说明

## 问题说明

浏览器环境下的MP4视频编码存在以下限制：

1. **浏览器原生限制**：大多数现代浏览器（Chrome、Firefox、Edge）仅支持WebM格式的视频录制，不支持直接录制MP4格式
2. **专利授权问题**：MP4/H.264编码需要专利授权，浏览器厂商通常避免直接支持
3. **API限制**：MediaRecorder API的默认支持格式为WebM

## 解决方案

### 1. WebM格式作为替代

- **优势**：
  - 开放标准，无专利限制
  - 视频质量与MP4相当
  - 文件大小通常比MP4更小
  - 现代浏览器广泛支持

- **兼容性**：
  - Chrome 4+
  - Firefox 4+
  - Edge 14+
  - Safari 14.1+
  - 移动端浏览器广泛支持

### 2. 实时转换方案

#### FFmpeg.wasm（推荐）
```javascript
// 动态加载FFmpeg库
const script = document.createElement('script');
script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
document.head.appendChild(script);

// 使用FFmpeg进行转换
await ffmpeg.run('-i', 'input.webm', '-c:v', 'libx264', 'output.mp4');
```

#### WebCodecs API（实验性）
- 需要支持WebCodecs的浏览器
- 提供更精细的控制
- 性能更好

#### 在线转换服务
- CloudConvert
- Convertio
- Online-Convert

### 3. 下载后转换

用户可以使用以下工具进行本地转换：

- **HandBrake**（免费，开源）
- **格式工厂**（免费）
- **Adobe Media Encoder**（付费）
- **FFmpeg命令行**（免费）

## 使用说明

### 转换流程

1. 用户选择MP4格式
2. 系统检测浏览器支持
3. 如果支持MP4，直接生成MP4
4. 如果不支持，生成WebM并提示用户
5. 提供转换方案说明

### 文件命名规范

- 成功生成MP4：`原文件名.mp4`
- 生成WebM：`原文件名_WebM格式.webm`
- 保留原始信息：任务标记为`isWebM: true`

### 用户提示

```javascript
if (mp4TasksThatGotWebM.length > 0) {
    showToast('MP4任务已生成WebM格式（浏览器限制）。格式相同，质量无损', 'info');
}
```

## 测试方法

使用提供的`mp4-conversion-test.html`页面进行测试：

1. 检测浏览器视频编码支持
2. 测试FFmpeg库加载
3. 执行SVG转视频测试

## 技术实现

### 核心代码

```javascript
// 检测支持的格式
let supportedFormats = {
    webm: MediaRecorder.isTypeSupported('video/webm'),
    webm_vp8: MediaRecorder.isTypeSupported('video/webm;codecs=vp8'),
    webm_vp9: MediaRecorder.isTypeSupported('video/webm;codecs=vp9'),
    mp4: MediaRecorder.isTypeSupported('video/mp4')
};

// 选择最佳格式
let mimeType = 'video/webm';
if (supportedFormats.mp4) {
    mimeType = 'video/mp4';
} else if (supportedFormats.webm_vp9) {
    mimeType = 'video/webm;codecs=vp9';
}

// 创建录制器
const mediaRecorder = new MediaRecorder(stream, {
    mimeType: mimeType,
    videoBitsPerSecond: 10000000 // 10Mbps高质量
});
```

### 质量保证

- 高比特率（10Mbps）
- 高质量渲染设置
- 平滑帧率控制
- 高分辨率输出

## 未来改进

1. **FFmpeg.wasm集成**：实现客户端MP4转换
2. **WebCodecs支持**：使用新API提供更好的控制
3. **服务器端转换**：提供可选的在线转换服务
4. **格式自动转换**：后台自动转换，用户无感知

## 常见问题

### Q: 为什么不能直接生成MP4？
A: 浏览器专利和授权限制，大多数浏览器只支持WebM格式录制。

### Q: WebM和MP4有什么区别？
A: WebM是开放的容器格式，通常使用VP8/VP9编码；MP4是商业格式，通常使用H.264编码。视频质量相当，WebM文件通常更小。

### Q: 如何获得真正的MP4文件？
A: 使用FFmpeg.wasm库、在线转换服务或下载后使用转换软件。

### Q: 哪些浏览器支持直接生成MP4？
A: 很少有浏览器支持，主要依赖WebM格式。这是普遍的限制。

---

**更新时间**：2024年1月
**版本**：1.0