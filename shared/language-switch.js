// 语言切换功能实现

// 语言配置
const languages = {
  'zh': {
    name: '中文',
    flag: '🇨🇳'
  },
  'en': {
    name: 'English',
    flag: '🇺🇸'
  }
};

// 翻译文本映射
const translations = {
  // 主页翻译
  '图像处理工具箱': {
    'en': 'Image Processing Toolbox'
  },
  '专业的本地图像处理解决方案': {
    'en': 'Professional Local Image Processing Solution'
  },
  '图像压缩': {
    'en': 'Image Compression'
  },
  '安全高效的本地化图像压缩服务': {
    'en': 'Safe and Efficient Local Image Compression Service'
  },
  '支持 PNG / JPG / WebP 格式': {
    'en': 'Supports PNG / JPG / WebP Formats'
  },
  '完全本地处理保护隐私': {
    'en': 'Fully Local Processing Protects Privacy'
  },
  '自定义压缩质量与尺寸': {
    'en': 'Customizable Compression Quality and Size'
  },
  '打开工具': {
    'en': 'Open Tool'
  },
  'SVG 转图片': {
    'en': 'SVG to Image'
  },
  '完全离线运行的矢量图转换器': {
    'en': 'Offline Vector Graphics Converter'
  },
  '批量转换为 PNG / JPG 格式': {
    'en': 'Batch Convert to PNG / JPG Formats'
  },
  '自定义输出尺寸与质量': {
    'en': 'Custom Output Size and Quality'
  },
  '完全离线运行无需联网': {
    'en': 'Fully Offline Operation No Internet Required'
  },
  '关闭窗口': {
    'en': 'Close Window'
  },
  
  // 页面标题翻译
  '图像处理工具箱': {
    'en': 'Image Processing Toolbox'
  },
  '本地图像无损压缩专家': {
    'en': 'Local Lossless Image Compression Expert'
  },
  'SVG转图片转换器': {
    'en': 'SVG to Image Converter'
  },
  
  // 图像压缩工具翻译
  '本地图像无损压缩专家': {
    'en': 'Local Lossless Image Compression Expert'
  },
  '安全高效的本地化图像压缩服务，完全离线处理保护您的隐私': {
    'en': 'Safe and Efficient Local Image Compression Service, Fully Offline Processing Protects Your Privacy'
  },
  '图像压缩工具': {
    'en': 'Image Compression Tool'
  },
  '点击选择图像文件或拖拽到此处': {
    'en': 'Click to Select Image Files or Drag Here'
  },
  '支持 PNG, JPG, JPEG, WebP, GIF, BMP 格式': {
    'en': 'Supports PNG, JPG, JPEG, WebP, GIF, BMP Formats'
  },
  '开始压缩': {
    'en': 'Start Compression'
  },
  '清空列表': {
    'en': 'Clear List'
  },
  '压缩结果': {
    'en': 'Compression Results'
  },
  '压缩质量': {
    'en': 'Compression Quality'
  },
  '尺寸调整': {
    'en': 'Size Adjustment'
  },
  '自动': {
    'en': 'Auto'
  },
  '输出格式': {
    'en': 'Output Format'
  },
  
  // SVG转换工具翻译
  'SVG转图片转换器': {
    'en': 'SVG to Image Converter'
  },
  '完全离线运行，支持批量转换，保护您的数据隐私': {
    'en': 'Fully Offline Operation, Supports Batch Conversion, Protects Your Data Privacy'
  },
  'SVG转图片工具': {
    'en': 'SVG to Image Tool'
  },
  '点击选择SVG文件或拖拽到此处': {
    'en': 'Click to Select SVG Files or Drag Here'
  },
  '支持 SVG 格式': {
    'en': 'Supports SVG Format'
  },
  '或粘贴SVG代码': {
    'en': 'Or Paste SVG Code'
  },
  '在此粘贴SVG代码...': {
    'en': 'Paste SVG Code Here...'
  },
  '添加到任务列表': {
    'en': 'Add to Task List'
  },
  '任务列表': {
    'en': 'Task List'
  },
  '清空全部': {
    'en': 'Clear All'
  },
  '暂无任务': {
    'en': 'No Tasks'
  },
  '请添加SVG文件或粘贴SVG代码': {
    'en': 'Please Add SVG Files or Paste SVG Code'
  },
  '批量转换': {
    'en': 'Batch Convert'
  },
  '批量下载': {
    'en': 'Batch Download'
  },
  '分辨率倍数': {
    'en': 'Resolution Multiplier'
  },
  '1x (标准)': {
    'en': '1x (Standard)'
  },
  '2x (2K)': {
    'en': '2x (2K)'
  },
  '3x (4K)': {
    'en': '3x (4K)'
  },
  '4x (8K)': {
    'en': '4x (8K)'
  },
  '图片质量': {
    'en': 'Image Quality'
  },
  '等待中': {
    'en': 'Pending'
  },
  '转换中': {
    'en': 'Converting'
  },
  '已完成': {
    'en': 'Completed'
  },
  '失败': {
    'en': 'Failed'
  },
  '下载': {
    'en': 'Download'
  },
  '重试': {
    'en': 'Retry'
  },
  '转换': {
    'en': 'Convert'
  },
  '请输入SVG代码': {
    'en': 'Please enter SVG code'
  },
  '已添加到任务列表': {
    'en': 'Added to task list'
  },
  '无效的SVG内容': {
    'en': 'Invalid SVG content'
  },
  '已添加 {count} 个文件到任务列表': {
    'en': 'Added {count} files to task list'
  },
  '文件 {name} 无效': {
    'en': 'File {name} is invalid'
  },
  '文件 {name} 不是SVG格式': {
    'en': 'File {name} is not SVG format'
  },
  '错误': {
    'en': 'Error'
  },
  '成功': {
    'en': 'Success'
  },
  '提示': {
    'en': 'Info'
  },
  '没有待转换的任务': {
    'en': 'No tasks to convert'
  },
  '开始批量转换 {count} 个任务': {
    'en': 'Starting batch conversion of {count} tasks'
  },
  '没有可下载的文件': {
    'en': 'No files available for download'
  },
  '正在下载 {count} 个文件': {
    'en': 'Downloading {count} files'
  },
  '已删除任务: {name}': {
    'en': 'Task deleted: {name}'
  },
  '所有任务已清除': {
    'en': 'All tasks cleared'
  },
  '{name} 转换完成': {
    'en': '{name} conversion completed'
  },
  '转换失败: {error}': {
    'en': 'Conversion failed: {error}'
  },
  '开始下载 {name}': {
    'en': 'Starting download of {name}'
  },
  '下载失败: {error}': {
    'en': 'Download failed: {error}'
  },
  '下载 {name} 失败: {error}': {
    'en': 'Download {name} failed: {error}'
  },
  
  // 通用翻译
  '返回工具箱': {
    'en': 'Back to Toolbox'
  },
  '错误': {
    'en': 'Error'
  },
  '成功': {
    'en': 'Success'
  },
  '提示': {
    'en': 'Info'
  },
  '没有待转换的任务': {
    'en': 'No tasks to convert'
  },
  '开始批量转换 {count} 个任务': {
    'en': 'Starting batch conversion of {count} tasks'
  },
  '没有可下载的文件': {
    'en': 'No files available for download'
  },
  '正在下载 {count} 个文件': {
    'en': 'Downloading {count} files'
  },
  '已删除任务: {name}': {
    'en': 'Task deleted: {name}'
  },
  '所有任务已清除': {
    'en': 'All tasks cleared'
  },
  '{name} 转换完成': {
    'en': '{name} conversion completed'
  },
  '转换失败: {error}': {
    'en': 'Conversion failed: {error}'
  },
  '开始下载 {name}': {
    'en': 'Starting download of {name}'
  },
  '下载失败: {error}': {
    'en': 'Download failed: {error}'
  },
  '下载 {name} 失败: {error}': {
    'en': 'Download {name} failed: {error}'
  },
  '错误': {
    'en': 'Error'
  },
  '成功': {
    'en': 'Success'
  },
  
  // 任务列表相关的文本
  '任务列表': {
    'en': 'Task List'
  },
  '任务列表 (1)': {
    'en': 'Task List (1)'
  },
  '清空全部': {
    'en': 'Clear All'
  },
  '已完成': {
    'en': 'Completed'
  },
  '等待中': {
    'en': 'Pending'
  },
  '转换中': {
    'en': 'Converting'
  },
  '失败': {
    'en': 'Failed'
  },
  
  // 文件信息展示文本
  'code (2).svg': {
    'en': 'code (2).svg'
  },
  
  // 图像处理参数文本
  'PNG': {
    'en': 'PNG'
  },
  'JPG': {
    'en': 'JPG'
  },
  '1x (标准)': {
    'en': '1x (Standard)'
  },
  '2x (2K)': {
    'en': '2x (2K)'
  },
  '3x (4K)': {
    'en': '3x (4K)'
  },
  '4x (8K)': {
    'en': '4x (8K)'
  },
  
  // 操作按钮文本
  '下载': {
    'en': 'Download'
  },
  '转换': {
    'en': 'Convert'
  },
  '重试': {
    'en': 'Retry'
  },
  '开始压缩': {
    'en': 'Start Compression'
  },
  '清空列表': {
    'en': 'Clear List'
  },
  
  // 尺寸选项翻译
  '75%': {
    'en': '75%'
  },
  '50%': {
    'en': '50%'
  },
  '25%': {
    'en': '25%'
  },
  '1920px': {
    'en': '1920px'
  },
  '1280px': {
    'en': '1280px'
  },
  
  // 文件大小信息文本
  '原始大小: 1.38 MB | 压缩后: 843.05 KB | 节省: 574.37 KB (40.5%)': {
    'en': 'Original Size: 1.38 MB | Compressed: 843.05 KB | Saved: 574.37 KB (40.5%)'
  },
  '原始大小': {
    'en': 'Original Size'
  },
  '压缩后': {
    'en': 'Compressed'
  },
  '节省': {
    'en': 'Saved'
  },
  '变化': {
    'en': 'Change'
  },
  '直接复制': {
    'en': 'Direct Copy'
  },
  '压缩中...': {
    'en': 'Compressing...'
  },
  '请先选择要压缩的图像文件': {
    'en': 'Please select image files to compress first'
  },
  '压缩完成': {
    'en': 'Compression Completed'
  },
  '文件 "{filename}" 下载成功': {
    'en': 'File "{filename}" downloaded successfully'
  },
  '文件 "{filename}" 下载失败: {error}': {
    'en': 'File "{filename}" download failed: {error}'
  },
  '下载完成: {name}': {
    'en': 'Download completed: {name}'
  },
  '下载失败: {name}': {
    'en': 'Download failed: {name}'
  },
  '正在下载中，请稍候': {
    'en': 'Downloading, please wait...'
  },
  '开始下载 {name}': {
    'en': 'Starting download of {name}'
  },
  '批量转换完成，成功 {success} 个，失败 {failed} 个': {
    'en': 'Batch conversion completed, {success} succeeded, {failed} failed'
  },
  '批量下载完成，成功 {success} 个，失败 {failed} 个': {
    'en': 'Batch download completed, {success} succeeded, {failed} failed'
  },
  '批量下载完成，共 {count} 个文件': {
    'en': 'Batch download completed, {count} files in total'
  },
  '没有可下载的文件': {
    'en': 'No files available for download'
  },
  '正在下载 {count} 个文件': {
    'en': 'Downloading {count} files'
  },
  '转换失败: {error}': {
    'en': 'Conversion failed: {error}'
  },
  '画布绘制失败: {error}': {
    'en': 'Canvas drawing failed: {error}'
  },
  'SVG加载失败': {
    'en': 'SVG loading failed'
  },
  '如果下载未开始，请检查浏览器设置': {
    'en': 'If download does not start, please check browser settings'
  }
};

// 创建语言切换浮框
function createLanguageSwitch() {
  // 检查是否已经存在语言切换浮框
  if (document.getElementById('languageSwitchContainer')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'languageSwitchContainer';
  container.className = 'language-switch-container';
  
  // 获取当前语言，默认为中文
  const currentLang = getCurrentLanguage();
  
  container.innerHTML = `
    <button id="languageSwitchBtn" class="language-switch-btn">
      <span>${languages[currentLang].flag}</span>
      <span>${languages[currentLang].name}</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div id="languageOptions" class="language-options">
      <div class="language-option" data-lang="zh">
        <span>🇨🇳</span>
        <span>中文</span>
      </div>
      <div class="language-option" data-lang="en">
        <span>🇺🇸</span>
        <span>English</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(container);
  
  // 添加事件监听器
  const switchBtn = document.getElementById('languageSwitchBtn');
  const options = document.getElementById('languageOptions');
  const languageOptions = document.querySelectorAll('.language-option');
  
  // 切换语言选项显示/隐藏
  switchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    options.classList.toggle('show');
  });
  
  // 点击选项切换语言
  languageOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedLang = option.getAttribute('data-lang');
      switchLanguage(selectedLang);
      options.classList.remove('show');
    });
  });
  
  // 点击其他地方隐藏选项
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      options.classList.remove('show');
    }
  });
  
  // 设置当前激活的语言
  updateActiveLanguage(currentLang);
}

// 获取当前语言
function getCurrentLanguage() {
  return localStorage.getItem('language') || 'zh';
}

// 切换语言
function switchLanguage(lang) {
  // 保存语言选择到localStorage
  localStorage.setItem('language', lang);
  
  // 更新界面语言
  updateUILanguage(lang);
  
  // 更新语言切换按钮显示
  updateActiveLanguage(lang);
}

// 更新激活语言显示
function updateActiveLanguage(lang) {
  const switchBtn = document.getElementById('languageSwitchBtn');
  if (switchBtn) {
    switchBtn.innerHTML = `
      <span>${languages[lang].flag}</span>
      <span>${languages[lang].name}</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    `;
  }
  
  // 更新选项激活状态
  document.querySelectorAll('.language-option').forEach(option => {
    const optionLang = option.getAttribute('data-lang');
    if (optionLang === lang) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

// 更新界面语言
function updateUILanguage(lang) {
  if (lang === 'zh') {
    // 如果是中文，刷新页面以恢复原始文本
    location.reload();
    return;
  }
  
  // 获取所有文本节点并翻译
  translateAllTextNodes(document.body, lang);
  
  // 触发窗口resize事件，以便重新调整布局
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 100);
}

// 翻译所有文本节点
function translateAllTextNodes(element, lang) {
  // 翻译元素的文本内容
  if (element.nodeType === Node.TEXT_NODE) {
    const text = element.textContent.trim();
    if (text && translations[text] && translations[text][lang]) {
      element.textContent = translations[text][lang];
    }
  }
  
  // 翻译元素的属性
  if (element.nodeType === Node.ELEMENT_NODE) {
    // 翻译placeholder属性
    if (element.placeholder) {
      const text = element.placeholder;
      if (translations[text] && translations[text][lang]) {
        element.placeholder = translations[text][lang];
      }
    }
    
    // 翻译title属性
    if (element.title) {
      const text = element.title;
      if (translations[text] && translations[text][lang]) {
        element.title = translations[text][lang];
      }
    }
    
    // 翻译aria-label属性
    if (element.getAttribute('aria-label')) {
      const text = element.getAttribute('aria-label');
      if (translations[text] && translations[text][lang]) {
        element.setAttribute('aria-label', translations[text][lang]);
      }
    }
    
    // 特殊处理某些元素的innerHTML
    if (element.tagName === 'TITLE' && element.textContent) {
      const text = element.textContent;
      if (translations[text] && translations[text][lang]) {
        element.textContent = translations[text][lang];
      }
    }
    
    // 特殊处理按钮元素，确保按钮内的文本也能被翻译
    if (element.tagName === 'BUTTON' && element.childNodes.length > 0) {
      for (let i = 0; i < element.childNodes.length; i++) {
        const childNode = element.childNodes[i];
        if (childNode.nodeType === Node.TEXT_NODE) {
          const text = childNode.textContent.trim();
          if (text && translations[text] && translations[text][lang]) {
            childNode.textContent = translations[text][lang];
          }
        }
      }
    }
  }
  
  // 递归处理子节点
  for (let i = 0; i < element.childNodes.length; i++) {
    translateAllTextNodes(element.childNodes[i], lang);
  }
}

// 页面加载完成后初始化语言切换功能
function initLanguageSwitch() {
  // 创建语言切换浮框
  createLanguageSwitch();
  
  // 如果当前语言不是中文，更新界面
  const currentLang = getCurrentLanguage();
  if (currentLang !== 'zh') {
    updateUILanguage(currentLang);
  }
}

// 等待页面完全加载后再初始化语言切换功能
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguageSwitch);
} else {
  // DOM已经加载完成
  initLanguageSwitch();
}

// 获取翻译文本函数
function getTranslation(key) {
  const currentLang = getCurrentLanguage();
  if (currentLang !== 'zh' && translations[key]) {
    return translations[key].en || key;
  }
  return key;
}

// 导出函数供其他脚本使用
window.LanguageSwitch = {
  getCurrentLanguage,
  switchLanguage,
  getTranslation
};