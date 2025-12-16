// 统一悬浮按钮管理

// 创建统一按钮容器
function createUniformButtonContainer() {
  // 检查是否已经存在容器
  if (document.getElementById('uniformButtonContainer')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'uniformButtonContainer';
  container.className = 'uniform-button-container';
  
  // 左侧按钮组
  const leftGroup = document.createElement('div');
  leftGroup.className = 'button-group';
  
  // 右侧按钮组
  const rightGroup = document.createElement('div');
  rightGroup.className = 'button-group';
  
  container.appendChild(leftGroup);
  container.appendChild(rightGroup);
  
  document.body.appendChild(container);
  
  return {
    container,
    leftGroup,
    rightGroup
  };
}

// 创建返回按钮
function createReturnButton() {
  const returnBtn = document.createElement('button');
  returnBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
    <span>返回工具箱</span>
  `;
  returnBtn.className = 'uniform-button primary';
  
  // 添加悬停效果
  returnBtn.addEventListener('mouseenter', () => {
    returnBtn.style.boxShadow = 'var(--shadow-lg)';
    returnBtn.style.transform = 'translateY(-1px)';
  });
  
  returnBtn.addEventListener('mouseleave', () => {
    returnBtn.style.boxShadow = 'var(--shadow-md)';
    returnBtn.style.transform = 'translateY(0)';
  });
  
  returnBtn.addEventListener('click', () => {
    console.log('Return button clicked');
    window.open('../index.html', '_self');
  });
  
  return returnBtn;
}

// 创建语言切换按钮
function createLanguageSwitchButton() {
  // 获取当前语言，默认为中文
  const currentLang = localStorage.getItem('language') || 'zh';
  
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
  
  const switchBtn = document.createElement('button');
  switchBtn.id = 'languageSwitchBtn';
  switchBtn.className = 'uniform-button';
  switchBtn.innerHTML = `
    <span>${languages[currentLang].flag}</span>
    <span>${languages[currentLang].name}</span>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  `;
  
  // 创建下拉选项
  const optionsContainer = document.createElement('div');
  optionsContainer.id = 'languageOptions';
  optionsContainer.className = 'uniform-dropdown';
  optionsContainer.innerHTML = `
    <div class="uniform-dropdown-option" data-lang="zh">
      <span>🇨🇳</span>
      <span>中文</span>
    </div>
    <div class="uniform-dropdown-option" data-lang="en">
      <span>🇺🇸</span>
      <span>English</span>
    </div>
  `;
  
  // 添加事件监听器
  switchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    optionsContainer.classList.toggle('show');
  });
  
  // 点击选项切换语言
  const languageOptions = optionsContainer.querySelectorAll('.uniform-dropdown-option');
  languageOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedLang = option.getAttribute('data-lang');
      
      // 保存语言选择到localStorage
      localStorage.setItem('language', selectedLang);
      
      // 更新按钮显示
      switchBtn.innerHTML = `
        <span>${languages[selectedLang].flag}</span>
        <span>${languages[selectedLang].name}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      `;
      
      // 切换语言
      if (selectedLang !== 'zh') {
        // 这里应该调用语言切换函数
        // 暂时刷新页面以应用语言更改
        location.reload();
      }
      
      optionsContainer.classList.remove('show');
    });
  });
  
  // 点击其他地方隐藏选项
  document.addEventListener('click', (e) => {
    if (!switchBtn.contains(e.target) && !optionsContainer.contains(e.target)) {
      optionsContainer.classList.remove('show');
    }
  });
  
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.appendChild(switchBtn);
  container.appendChild(optionsContainer);
  
  return container;
}

// 创建主题切换按钮
function createThemeSwitchButton() {
  // 获取当前主题，默认为系统主题
  const currentTheme = localStorage.getItem('theme') || 'system';
  
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
  
  const switchBtn = document.createElement('button');
  switchBtn.id = 'themeSwitchBtn';
  switchBtn.className = 'uniform-button';
  switchBtn.innerHTML = `
    <span>${themes[currentTheme].icon}</span>
    <span>${themes[currentTheme].name}</span>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  `;
  
  // 创建下拉选项
  const optionsContainer = document.createElement('div');
  optionsContainer.id = 'themeOptions';
  optionsContainer.className = 'uniform-dropdown';
  optionsContainer.innerHTML = `
    <div class="uniform-dropdown-option" data-theme="light">
      <span>☀️</span>
      <span>浅色主题</span>
    </div>
    <div class="uniform-dropdown-option" data-theme="dark">
      <span>🌙</span>
      <span>深色主题</span>
    </div>
    <div class="uniform-dropdown-option" data-theme="system">
      <span>💻</span>
      <span>跟随系统</span>
    </div>
  `;
  
  // 添加事件监听器
  switchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    optionsContainer.classList.toggle('show');
  });
  
  // 点击选项切换主题
  const themeOptions = optionsContainer.querySelectorAll('.uniform-dropdown-option');
  themeOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedTheme = option.getAttribute('data-theme');
      
      // 保存主题选择到localStorage
      localStorage.setItem('theme', selectedTheme);
      
      // 更新按钮显示
      switchBtn.innerHTML = `
        <span>${themes[selectedTheme].icon}</span>
        <span>${themes[selectedTheme].name}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      `;
      
      // 应用主题
      if (selectedTheme === 'system') {
        // 跟随系统主题
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        // 应用指定主题
        document.documentElement.setAttribute('data-theme', selectedTheme);
      }
      
      // 更新选项激活状态
      themeOptions.forEach(opt => {
        const optTheme = opt.getAttribute('data-theme');
        if (optTheme === selectedTheme) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
      
      optionsContainer.classList.remove('show');
    });
  });
  
  // 点击其他地方隐藏选项
  document.addEventListener('click', (e) => {
    if (!switchBtn.contains(e.target) && !optionsContainer.contains(e.target)) {
      optionsContainer.classList.remove('show');
    }
  });
  
  // 设置当前激活的主题
  const activeOption = optionsContainer.querySelector(`[data-theme="${currentTheme}"]`);
  if (activeOption) {
    activeOption.classList.add('active');
  }
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
  
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.appendChild(switchBtn);
  container.appendChild(optionsContainer);
  
  return container;
}

// 初始化统一按钮
function initUniformButtons() {
  // 创建按钮容器
  const { leftGroup, rightGroup } = createUniformButtonContainer();
  
  // 创建并添加返回按钮到左侧
  const returnBtn = createReturnButton();
  leftGroup.appendChild(returnBtn);
  
  // 创建并添加语言切换按钮到右侧
  const languageSwitch = createLanguageSwitchButton();
  rightGroup.appendChild(languageSwitch);
  
  // 创建并添加主题切换按钮到右侧
  const themeSwitch = createThemeSwitchButton();
  rightGroup.appendChild(themeSwitch);
}

// 等待页面完全加载后再初始化统一按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUniformButtons);
} else {
  // DOM已经加载完成
  initUniformButtons();
}

// 导出函数供其他脚本使用
window.UniformButtons = {
  initUniformButtons
};