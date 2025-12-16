// 主题切换功能实现

// 主题配置
const themes = {
  'light': {
    name: '浅色主题',
    icon: '☀️'
  },
  'dark': {
    name: '深色主题',
    icon: '🌙'
  },
  'system': {
    name: '跟随系统',
    icon: '💻'
  }
};

// 创建主题切换器
function createThemeSwitch() {
  // 检查是否已经存在主题切换器
  if (document.getElementById('themeSwitchContainer')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'themeSwitchContainer';
  container.className = 'theme-switch-container';
  
  // 获取当前主题，默认为系统主题
  const currentTheme = getCurrentTheme();
  
  container.innerHTML = `
    <button id="themeSwitchBtn" class="theme-switch-btn">
      <span>${themes[currentTheme].icon}</span>
      <span>${themes[currentTheme].name}</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div id="themeOptions" class="theme-options">
      <div class="theme-option" data-theme="light">
        <span>☀️</span>
        <span>浅色主题</span>
      </div>
      <div class="theme-option" data-theme="dark">
        <span>🌙</span>
        <span>深色主题</span>
      </div>
      <div class="theme-option" data-theme="system">
        <span>💻</span>
        <span>跟随系统</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(container);
  
  // 添加事件监听器
  const switchBtn = document.getElementById('themeSwitchBtn');
  const options = document.getElementById('themeOptions');
  const themeOptions = document.querySelectorAll('.theme-option');
  
  // 切换主题选项显示/隐藏
  switchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    options.classList.toggle('show');
  });
  
  // 点击选项切换主题
  themeOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedTheme = option.getAttribute('data-theme');
      switchTheme(selectedTheme);
      options.classList.remove('show');
    });
  });
  
  // 点击其他地方隐藏选项
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      options.classList.remove('show');
    }
  });
  
  // 设置当前激活的主题
  updateActiveTheme(currentTheme);
}

// 获取当前主题
function getCurrentTheme() {
  return localStorage.getItem('theme') || 'system';
}

// 切换主题
function switchTheme(theme) {
  // 保存主题选择到localStorage
  localStorage.setItem('theme', theme);
  
  // 应用主题
  applyTheme(theme);
  
  // 更新主题切换按钮显示
  updateActiveTheme(theme);
}

// 更新激活主题显示
function updateActiveTheme(theme) {
  const switchBtn = document.getElementById('themeSwitchBtn');
  if (switchBtn) {
    switchBtn.innerHTML = `
      <span>${themes[theme].icon}</span>
      <span>${themes[theme].name}</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    `;
  }
  
  // 更新选项激活状态
  document.querySelectorAll('.theme-option').forEach(option => {
    const optionTheme = option.getAttribute('data-theme');
    if (optionTheme === theme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

// 应用主题
function applyTheme(theme) {
  if (theme === 'system') {
    // 跟随系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    // 应用指定主题
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// 监听系统主题变化
function watchSystemTheme() {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const currentTheme = getCurrentTheme();
    if (currentTheme === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
}

// 页面加载完成后初始化主题切换功能
function initThemeSwitch() {
  // 创建主题切换器
  createThemeSwitch();
  
  // 应用当前主题
  const currentTheme = getCurrentTheme();
  applyTheme(currentTheme);
  
  // 监听系统主题变化
  watchSystemTheme();
}

// 等待页面完全加载后再初始化主题切换功能
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeSwitch);
} else {
  // DOM已经加载完成
  initThemeSwitch();
}

// 导出函数供其他脚本使用
window.ThemeSwitch = {
  getCurrentTheme,
  switchTheme
};