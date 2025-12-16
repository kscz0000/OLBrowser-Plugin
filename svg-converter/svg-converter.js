// 安全模块加载状态
let svgSecurityLoaded = false;
let fileValidatorLoaded = false;
let resourceManagerLoaded = false;

// 检查安全模块是否已加载
function checkSecurityModules() {
    svgSecurityLoaded = typeof SvgSecurity !== 'undefined';
    fileValidatorLoaded = typeof FileValidator !== 'undefined';
    resourceManagerLoaded = typeof ResourceManager !== 'undefined';
    
    if (!svgSecurityLoaded) {
        console.warn('SVG安全模块未加载，安全性降低');
    }
    if (!fileValidatorLoaded) {
        console.warn('文件验证模块未加载，安全性降低');
    }
    if (!resourceManagerLoaded) {
        console.warn('资源管理模块未加载，内存管理可能受影响');
    }
}

// DOM元素引用
const svgText = document.getElementById('svgText');
const addTextTaskBtn = document.getElementById('addTextTask');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const resolutionSlider = document.getElementById('resolutionSlider');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const qualityContainer = document.getElementById('qualityContainer');
const taskCount = document.getElementById('taskCount');
const emptyState = document.getElementById('emptyState');
const taskList = document.getElementById('taskList');
const batchActions = document.getElementById('batchActions');
const convertAll = document.getElementById('convertAll');
const downloadAll = document.getElementById('downloadAll');
const clearAll = document.getElementById('clearAll');
const toastContainer = document.getElementById('toastContainer');

// 任务数据
let tasks = [];
let taskIdCounter = 0;

// 用于防止重复下载的任务ID集合
const downloadingTasks = new Set();

// 分辨率选项
const resolutionOptions = [
    { value: 1, label: '1x (标准)' },
    { value: 2, label: '2x (2K)' },
    { value: 3, label: '3x (4K)' },
    { value: 4, label: '4x (8K)' }
];

// 事件监听器
addTextTaskBtn.addEventListener('click', handleAddTextTask);
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileUpload);

// 格式选择器事件委托
document.querySelector('.format-selector').addEventListener('click', function(e) {
    const formatOption = e.target.closest('.format-option');
    if (!formatOption) return;
    
    // 移除所有激活状态
    document.querySelectorAll('.format-option').forEach(el => el.classList.remove('active'));
    
    // 激活当前选项
    formatOption.classList.add('active');
    
    // 更新质量可见性
    updateQualityVisibility();
    
    // 更新所有待处理任务的格式参数
    const format = formatOption.getAttribute('data-format');
    updatePendingTasksParameter('format', format === 'jpeg' ? 'jpg' : format);
});

// 分辨率滑块事件
resolutionSlider.addEventListener('input', handleResolutionChange);

// 质量滑块事件
qualitySlider.addEventListener('input', handleQualityChange);

// 批量操作按钮
convertAll.addEventListener('click', handleConvertAll);
downloadAll.addEventListener('click', handleDownloadAll);
clearAll.addEventListener('click', handleClearAll);

// 尺寸预设按钮事件委托
document.querySelector('.size-presets').addEventListener('click', function(e) {
    const sizePreset = e.target.closest('.size-preset');
    if (!sizePreset) return;
    
    // 移除所有激活状态
    document.querySelectorAll('.size-preset').forEach(el => el.classList.remove('active'));
    
    // 激活当前选项
    sizePreset.classList.add('active');
    
    // 更新滑块值
    const size = sizePreset.getAttribute('data-size');
    resolutionSlider.value = size;
    
    // 触发滑块变更事件，以更新待处理任务的分辨率参数
    resolutionSlider.dispatchEvent(new Event('input'));
});

// 初始化
updateQualityVisibility();

// 检查安全模块
checkSecurityModules();

// 初始化滑块背景
updateSliderBackground(resolutionSlider);
updateSliderBackground(qualitySlider);

// 根据当前语言初始化界面文本
function initializeLanguage() {
    if (typeof LanguageSwitch !== 'undefined') {
        const currentLang = LanguageSwitch.getCurrentLanguage();
        if (currentLang !== 'zh') {
            // 更新页面标题和副标题
            const pageTitle = document.querySelector('.page-title');
            const pageSubtitle = document.querySelector('.page-subtitle');
            const cardTitle = document.querySelector('.card-title');
            
            if (pageTitle) pageTitle.textContent = getTranslation('SVG转图片转换器');
            if (pageSubtitle) pageSubtitle.textContent = getTranslation('完全离线运行，支持批量转换，保护您的数据隐私');
            if (cardTitle) {
                cardTitle.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    ${getTranslation('SVG转图片工具')}
                `;
            }
            
            // 更新上传区域文本
            const uploadText = document.querySelector('.upload-text');
            const uploadHint = document.querySelector('.upload-hint');
            if (uploadText) uploadText.textContent = getTranslation('点击选择SVG文件或拖拽到此处');
            if (uploadHint) uploadHint.textContent = getTranslation('支持 SVG 格式');
            
            // 更新SVG文本区域
            const svgSectionTitle = document.querySelector('.svg-text-section .section-title');
            const svgPlaceholder = document.getElementById('svgText');
            if (svgSectionTitle) svgSectionTitle.textContent = getTranslation('或粘贴SVG代码');
            if (svgPlaceholder) svgPlaceholder.placeholder = getTranslation('在此粘贴SVG代码...');
            
            // 更新空状态文本
            const emptyText = document.querySelector('.empty-text');
            const emptySubtext = document.querySelector('.empty-subtext');
            if (emptyText) emptyText.textContent = getTranslation('暂无任务');
            if (emptySubtext) emptySubtext.textContent = getTranslation('请添加SVG文件或粘贴SVG代码');
            
            // 更新任务列表标题
            updateTaskListTitle();
            
            // 更新控制面板文本
            updateControlPanelTexts();
        }
    }
}

// 更新控制面板文本
function updateControlPanelTexts() {
    // 更新输出格式标签
    const formatLabel = document.querySelector('.control-label span');
    if (formatLabel && formatLabel.textContent === '输出格式') {
        formatLabel.textContent = getTranslation('输出格式');
    }
    
    // 更新分辨率标签
    const resolutionLabels = document.querySelectorAll('.control-label span');
    resolutionLabels.forEach(label => {
        if (label.textContent === '分辨率倍数') {
            label.textContent = getTranslation('分辨率倍数');
        }
        if (label.textContent === '图片质量') {
            label.textContent = getTranslation('图片质量');
        }
    });
    
    // 更新尺寸预设按钮
    const sizePresets = document.querySelectorAll('.size-preset');
    const presetLabels = ['1x (标准)', '2x (2K)', '3x (4K)', '4x (8K)'];
    sizePresets.forEach((preset, index) => {
        if (presetLabels[index] && preset.textContent.includes(presetLabels[index])) {
            preset.textContent = getTranslation(presetLabels[index]);
        }
    });
    
    // 更新格式选项
    const formatOptions = document.querySelectorAll('.format-option');
    formatOptions.forEach(option => {
        const format = option.getAttribute('data-format');
        if (format === 'png' && option.textContent === 'PNG') {
            option.textContent = getTranslation('PNG');
        } else if (format === 'jpeg' && option.textContent === 'JPG') {
            option.textContent = getTranslation('JPG');
        }
    });
}

// 执行初始化
initializeLanguage();

// 定期检查并修复任务列表标题的显示
setInterval(() => {
    const currentLang = LanguageSwitch && LanguageSwitch.getCurrentLanguage ? LanguageSwitch.getCurrentLanguage() : 'zh';
    const taskListTitle = document.querySelector('.file-list-header h3');
    if (taskListTitle) {
        const currentTitle = taskListTitle.textContent.trim();
        const expectedTitle = currentLang === 'en' ? 'Task List' : '任务列表';
        // 如果标题不正确，更新它
        if (!currentTitle.startsWith(expectedTitle)) {
            const taskCount = document.getElementById('taskCount')?.textContent || '0';
            taskListTitle.innerHTML = `${expectedTitle} (<span id="taskCount">${taskCount}</span>)`;
        }
    }
}, 500);

// 页面加载完成后，监听语言选项点击
document.addEventListener('DOMContentLoaded', function() {
    const currentLang = LanguageSwitch && LanguageSwitch.getCurrentLanguage ? LanguageSwitch.getCurrentLanguage() : 'zh';
    updateTaskListTitleDirectly(currentLang);
    
    // 使用MutationObserver监听语言切换按钮的点击和DOM变化
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // 检查是否有语言切换按钮被创建或修改
            const languageOptions = document.querySelectorAll('.language-option');
            if (languageOptions.length > 0) {
                // 监听语言选项的点击事件
                languageOptions.forEach(option => {
                    // 移除旧的事件监听器，避免重复绑定
                    option.removeEventListener('click', handleLanguageOptionClick);
                    // 添加新的事件监听器
                    option.addEventListener('click', handleLanguageOptionClick);
                });
            }
        });
    });
    
    // 开始观察整个文档的变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// 处理语言选项点击的函数
function handleLanguageOptionClick(e) {
    const selectedLang = e.currentTarget.getAttribute('data-lang');
    // 延迟执行，确保语言切换完成
    setTimeout(() => {
        updateTaskListTitleDirectly(selectedLang);
    }, 100);
}

// 监听窗口resize事件，重新调整滑块背景
window.addEventListener('resize', function() {
    updateSliderBackground(resolutionSlider);
    updateSliderBackground(qualitySlider);
});

// 直接监听语言选项的点击事件，确保任务列表标题能正确更新
document.addEventListener('click', function(e) {
    const langOption = e.target.closest('.language-option');
    if (langOption) {
        const selectedLang = langOption.getAttribute('data-lang');
        // 延迟执行，确保语言切换完成
        setTimeout(() => {
            updateTaskListTitleDirectly(selectedLang);
        }, 300);
    }
});

// 直接更新任务列表标题，不依赖getTranslation
function updateTaskListTitleDirectly(lang) {
    const taskListTitle = document.querySelector('.file-list-header h3');
    if (taskListTitle) {
        const taskCount = document.getElementById('taskCount')?.textContent || '0';
        // 根据语言设置正确的文本
        const titleText = lang === 'en' ? 'Task List' : '任务列表';
        taskListTitle.innerHTML = `${titleText} (<span id="taskCount">${taskCount}</span>)`;
    }
}

// 监听语言切换事件，确保布局正确调整
window.addEventListener('languageChanged', function() {
    // 延迟执行以确保翻译完成
    setTimeout(() => {
        const currentLang = LanguageSwitch.getCurrentLanguage();
        
        // 直接更新任务列表标题
        updateTaskListTitleDirectly(currentLang);
        
        // 重新渲染所有任务项以应用翻译
        renderTasks();
        
        // 确保更新任务列表标题
        updateTaskListTitle();
        
        // 更新批量操作按钮文本
        const convertAllBtn = document.getElementById('convertAll');
        const downloadAllBtn = document.getElementById('downloadAll');
        const clearAllBtn = document.getElementById('clearAll');
        const addTextTaskBtn = document.getElementById('addTextTask');
        
        if (convertAllBtn) {
            const convertText = convertAllBtn.textContent.trim();
            if (convertText === '批量转换' || convertText === 'Batch Convert') {
                convertAllBtn.innerHTML = `
                    ${convertAllBtn.querySelector('svg') ? convertAllBtn.querySelector('svg').outerHTML : ''}
                    ${getTranslation('批量转换')}
                `;
            }
        }
        
        if (downloadAllBtn) {
            const downloadText = downloadAllBtn.querySelector('svg') ? 
                downloadAllBtn.textContent.replace(/\s+/g, ' ').trim() : 
                downloadAllBtn.textContent.trim();
            if (downloadText.includes('批量下载') || downloadText.includes('Batch Download')) {
                downloadAllBtn.innerHTML = `
                    ${downloadAllBtn.querySelector('svg') ? downloadAllBtn.querySelector('svg').outerHTML : ''}
                    ${getTranslation('批量下载')}
                `;
            }
        }
        
        if (clearAllBtn) {
            const clearText = clearAllBtn.textContent.trim();
            if (clearText === '清空全部' || clearText === 'Clear All') {
                clearAllBtn.innerHTML = `
                    ${clearAllBtn.querySelector('svg') ? clearAllBtn.querySelector('svg').outerHTML : ''}
                    ${getTranslation('清空全部')}
                `;
            }
        }
        
        if (addTextTaskBtn) {
            const addText = addTextTaskBtn.textContent.trim();
            if (addText === '添加到任务列表' || addText === 'Add to Task List') {
                addTextTaskBtn.innerHTML = `
                    ${addTextTaskBtn.querySelector('svg') ? addTextTaskBtn.querySelector('svg').outerHTML : ''}
                    ${getTranslation('添加到任务列表')}
                `;
            }
        }
        
        // 触发窗口resize事件，确保其他组件也重新调整
        window.dispatchEvent(new Event('resize'));
    }, 200);
});

// 更新任务列表标题
function updateTaskListTitle() {
    const taskListTitle = document.querySelector('.file-list-header h3');
    if (taskListTitle) {
        const taskCount = document.getElementById('taskCount').textContent;
        // 直接使用当前语言判断，而不是依赖getTranslation函数
        const currentLang = LanguageSwitch && LanguageSwitch.getCurrentLanguage ? LanguageSwitch.getCurrentLanguage() : 'zh';
        const titleText = currentLang === 'en' ? 'Task List' : '任务列表';
        taskListTitle.innerHTML = `${titleText} (<span id="taskCount">${taskCount}</span>)`;
    }
}

// 更新滑块背景渐变
function updateSliderBackground(slider) {
    const percentage = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    // 使用纯色替代渐变
    slider.style.background = `var(--color-border)`;
    // 添加一个伪元素来显示进度
    if (!slider.nextElementSibling || !slider.nextElementSibling.classList.contains('slider-progress')) {
        const progress = document.createElement('div');
        progress.className = 'slider-progress';
        progress.style.position = 'absolute';
        progress.style.height = '100%';
        progress.style.left = '0';
        progress.style.top = '0';
        progress.style.backgroundColor = 'var(--color-primary)';
        progress.style.borderRadius = 'inherit';
        progress.style.width = `${percentage}%`;
        progress.style.zIndex = '-1';
        slider.parentNode.style.position = 'relative';
        slider.parentNode.insertBefore(progress, slider);
    } else {
        slider.nextElementSibling.style.width = `${percentage}%`;
    }
}

// 添加任务列表的事件委托
taskList.addEventListener('click', function(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const taskId = button.getAttribute('data-task-id');
    const action = button.getAttribute('data-action');
    
    switch(action) {
        case 'delete':
            handleDeleteTask(taskId);
            break;
        case 'convert':
            handleConvertTask(taskId);
            break;
        case 'download':
            handleDownloadTask(taskId);
            break;
    }
});

// 添加任务列表的触摸事件支持（移动设备）
taskList.addEventListener('touchend', function(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const taskId = button.getAttribute('data-task-id');
    const action = button.getAttribute('data-action');
    
    switch(action) {
        case 'delete':
            handleDeleteTask(taskId);
            break;
        case 'convert':
            handleConvertTask(taskId);
            break;
        case 'download':
            handleDownloadTask(taskId);
            break;
    }
});

// 处理文本添加任务
function handleAddTextTask() {
    const text = svgText.value.trim();
    if (!text) {
        showToast(getTranslation('请输入SVG代码'), 'error');
        return;
    }

    try {
        // 使用安全模块验证和清理SVG内容
        if (svgSecurityLoaded) {
            const validation = SvgSecurity.sanitizeSvg(text);
            if (!validation.isValid) {
                showToast(validation.errors.join(', ') || getTranslation('无效的SVG内容'), 'error');
                return;
            }
            
            // 使用清理后的SVG内容
            const dimensions = SvgSecurity.getSvgDimensions(text);
            if (!dimensions.isValid) {
                showToast(getTranslation('无法解析SVG尺寸'), 'error');
                return;
            }
            
            const task = createTask(`SVG Text_${tasks.length + 1}`, validation.cleanedSvg);
            tasks.push(task);
            svgText.value = '';
            updateUI();
            showToast(getTranslation('已添加到任务列表'), 'success');
        } else {
            // 降级方案：使用原始验证方法
            parseSvgDimensions(text);
            const task = createTask(`SVG Text_${tasks.length + 1}`, text);
            tasks.push(task);
            svgText.value = '';
            updateUI();
            showToast(getTranslation('已添加到任务列表'), 'success');
        }
    } catch (error) {
        showToast(error.message || getTranslation('无效的SVG内容'), 'error');
    }
}

// 处理文件上传
async function handleFileUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 使用文件验证模块进行验证
    if (fileValidatorLoaded) {
        try {
            const validation = await FileValidator.validateMultipleFiles(files);
            
            // 处理无效文件
            if (validation.invalidFiles.length > 0) {
                validation.invalidFiles.forEach(({ file, errors }) => {
                    showToast(`${file.name}: ${errors.join(', ')}`, 'error');
                });
            }
            
            // 处理有效文件
            if (validation.validFiles.length === 0) {
                updateUI();
                fileInput.value = '';
                return;
            }
            
            // 处理有效的SVG文件
            const newTasks = [];
            let processedCount = 0;
            
            for (const file of validation.validFiles) {
                if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
                    try {
                        const reader = new FileReader();
                        await new Promise((resolve, reject) => {
                            reader.onload = function(e) {
                                resolve(e.target.result);
                            };
                            reader.onerror = reject;
                            reader.readAsText(file);
                        });
                        
                        const content = reader.result;
                        
                        // 使用SVG安全模块验证和清理
                        if (svgSecurityLoaded) {
                            const svgValidation = SvgSecurity.sanitizeSvg(content);
                            if (!svgValidation.isValid) {
                                showToast(`${file.name}: ${svgValidation.errors.join(', ')}`, 'error');
                                processedCount++;
                                continue;
                            }
                            
                            const task = createTask(file.name, svgValidation.cleanedSvg);
                            newTasks.push(task);
                        } else {
                            // 降级方案
                            parseSvgDimensions(content);
                            const task = createTask(file.name, content);
                            newTasks.push(task);
                        }
                        
                        processedCount++;
                    } catch (error) {
                        showToast(getTranslation('文件 {name} 无效').replace('{name}', file.name), 'error');
                        processedCount++;
                    }
                }
                
                // 处理完成后更新UI
                if (processedCount === validation.validFiles.length) {
                    if (newTasks.length > 0) {
                        tasks.push(...newTasks);
                        updateUI();
                        showToast(getTranslation('已添加 {count} 个文件到任务列表').replace('{count}', newTasks.length), 'success');
                    }
                    
                    // 重置文件输入元素
                    fileInput.value = '';
                }
            }
        } catch (error) {
            console.error('文件验证过程出错:', error);
            showToast('文件验证失败', 'error');
            fileInput.value = '';
        }
    } else {
        // 降级方案：使用原始文件处理方法
        const newTasks = [];
        let processedCount = 0;
        
        Array.from(files).forEach(file => {
            if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    try {
                        parseSvgDimensions(content);
                        const task = createTask(file.name, content);
                        newTasks.push(task);
                        processedCount++;
                        
                        if (processedCount === files.length) {
                            tasks.push(...newTasks);
                            updateUI();
                            showToast(getTranslation('已添加 {count} 个文件到任务列表').replace('{count}', newTasks.length), 'success');
                            
                            // 重置文件输入元素，允许重新上传相同文件
                            fileInput.value = '';
                        }
                    } catch (error) {
                        showToast(getTranslation('文件 {name} 无效').replace('{name}', file.name), 'error');
                        processedCount++;
                        if (processedCount === files.length) {
                            updateUI();
                            // 重置文件输入元素，允许重新上传相同文件
                            fileInput.value = '';
                        }
                    }
                };
                reader.readAsText(file);
            } else {
                showToast(getTranslation('文件 {name} 不是SVG格式').replace('{name}', file.name), 'error');
                processedCount++;
                if (processedCount === files.length) {
                    updateUI();
                    // 重置文件输入元素，允许重新上传相同文件
                    fileInput.value = '';
                }
            }
        });
    }
}

// 拖拽处理
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        handleFileUpload({ target: { files } });
    }
}

// 分辨率变更处理
function handleResolutionChange() {
    // 更新激活的尺寸预设
    const size = resolutionSlider.value;
    document.querySelectorAll('.size-preset').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-size') == size);
    });
    
    // 更新滑块背景
    updateSliderBackground(resolutionSlider);
    
    // 更新所有待处理任务的分辨率参数
    updatePendingTasksParameter('resolution', parseInt(size));
}

// 质量滑块变更处理
function handleQualityChange() {
    const quality = qualitySlider.value;
    qualityValue.textContent = quality;
    
    // 更新滑块背景
    updateSliderBackground(qualitySlider);
    
    // 更新所有待处理任务的质量参数
    updatePendingTasksParameter('quality', parseInt(quality));
}

// 更新待处理任务的指定参数
function updatePendingTasksParameter(parameter, value) {
    let hasUpdated = false;
    tasks.forEach(task => {
        // 只更新待处理状态的任务
        if (task.status === 'pending') {
            task[parameter] = value;
            hasUpdated = true;
        }
    });
    
    // 如果有任务被更新，则重新渲染任务列表
    if (hasUpdated) {
        renderTasks();
        updateBatchActionsState();
    }
}

// 格式变更处理
function updateQualityVisibility() {
    const activeFormat = document.querySelector('.format-option.active').getAttribute('data-format');
    if (activeFormat === 'jpeg') {
        qualityContainer.style.display = 'block';
    } else {
        qualityContainer.style.display = 'none';
    }
}

// 创建任务对象
function createTask(name, svgContent) {
    const activeFormat = document.querySelector('.format-option.active').getAttribute('data-format');
    const resolution = parseInt(resolutionSlider.value);
    const quality = parseInt(qualitySlider.value);
    
    return {
        id: `task_${++taskIdCounter}`,
        name,
        svgContent,
        status: 'pending',
        format: activeFormat === 'jpeg' ? 'jpg' : activeFormat,
        quality: quality,
        resolution: resolution,
        resultUrl: null,
        error: null
    };
}

// 解析SVG尺寸
function parseSvgDimensions(svgContent) {
    // 如果安全模块可用，使用安全的方法
    if (svgSecurityLoaded) {
        const dimensions = SvgSecurity.getSvgDimensions(svgContent);
        if (!dimensions.isValid) {
            throw new Error('无法解析SVG尺寸');
        }
        return { width: dimensions.width, height: dimensions.height };
    }
    
    // 降级方案：使用原始解析方法
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    if (!svgElement) {
        throw new Error('无效的SVG内容');
    }

    let width = 300;
    let height = 300;

    const widthAttr = svgElement.getAttribute('width');
    const heightAttr = svgElement.getAttribute('height');

    if (widthAttr && heightAttr) {
        width = parseFloat(widthAttr);
        height = parseFloat(heightAttr);
    } else {
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.split(/\s+|,/);
            if (parts.length === 4) {
                width = parseFloat(parts[2]);
                height = parseFloat(parts[3]);
            }
        }
    }

    return { width, height };
}

// 转换单个SVG - 使用资源管理器防止内存泄漏
async function convertSvg(task) {
    return new Promise((resolve, reject) => {
        const managedResources = [];
        
        try {
            const { width, height } = parseSvgDimensions(task.svgContent);
            const scaledWidth = Math.floor(width * task.resolution);
            const scaledHeight = Math.floor(height * task.resolution);

            // 确保尺寸在合理范围内
            const finalWidth = Math.min(Math.max(scaledWidth, 1), 16384);
            const finalHeight = Math.min(Math.max(scaledHeight, 1), 16384);

            // 使用资源管理器创建Canvas
            let canvasResource;
            let ctx;
            if (resourceManagerLoaded && typeof createManagedCanvas === 'function') {
                canvasResource = createManagedCanvas(finalWidth, finalHeight, { taskId: task.id });
                managedResources.push(canvasResource.resourceId);
                ctx = canvasResource.canvas.getContext('2d');
            } else {
                // 降级方案：直接创建Canvas
                const canvas = document.createElement('canvas');
                canvas.width = finalWidth;
                canvas.height = finalHeight;
                ctx = canvas.getContext('2d');
                canvasResource = { canvas };
            }

            if (!ctx) {
                throw new Error('无法创建Canvas上下文');
            }

            // 清空画布
            ctx.clearRect(0, 0, finalWidth, finalHeight);

            // 为JPG格式添加背景色
            if (task.format === 'jpg' || task.format === 'jpeg') {
                // 检查当前是否为夜间模式
                const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || 
                                 (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && 
                                  !document.documentElement.hasAttribute('data-theme'));
                
                // 夜间模式下使用浅灰色背景，日间模式使用白色背景
                ctx.fillStyle = isDarkMode ? '#f8fafc' : 'white';
                ctx.fillRect(0, 0, finalWidth, finalHeight);
            }

            // 创建安全的SVG字符串，避免潜在的安全问题
            let safeSvgContent = task.svgContent;
            
            // 如果安全模块可用，使用已清理的SVG内容
            if (svgSecurityLoaded) {
                // SVG内容在添加任务时已经被清理，这里直接使用
                safeSvgContent = task.svgContent;
            } else {
                // 降级方案：基础安全清理
                safeSvgContent = safeSvgContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                safeSvgContent = safeSvgContent.replace(/on\w+="[^"]*"/gi, '');
                safeSvgContent = safeSvgContent.replace(/javascript:/gi, '');
                
                // 确保SVG有命名空间
                if (!safeSvgContent.includes('xmlns="http://www.w3.org/2000/svg"')) {
                    safeSvgContent = safeSvgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
                }
            }

            // 使用资源管理器创建Blob URL
            let svgBlobUrl;
            if (resourceManagerLoaded && typeof createManagedBlobUrl === 'function') {
                const blob = new Blob([safeSvgContent], { type: 'image/svg+xml;charset=utf-8' });
                const urlResource = createManagedBlobUrl(blob, { taskId: task.id, type: 'svg' });
                managedResources.push(urlResource.resourceId);
                svgBlobUrl = urlResource.url;
            } else {
                // 降级方案：直接创建Blob URL
                const blob = new Blob([safeSvgContent], { type: 'image/svg+xml;charset=utf-8' });
                svgBlobUrl = URL.createObjectURL(blob);
            }
            
            // 使用资源管理器创建Image对象
            let imgResource;
            let img;
            if (resourceManagerLoaded && typeof createManagedImage === 'function') {
                imgResource = createManagedImage({ taskId: task.id, svgUrl: svgBlobUrl });
                managedResources.push(imgResource.resourceId);
                img = imgResource.image;
            } else {
                // 降级方案：直接创建Image
                img = new Image();
            }
            
            // 设置超时和清理函数
            const cleanup = () => {
                if (resourceManagerLoaded) {
                    // 资源管理器会自动清理
                } else {
                    // 降级方案：手动清理
                    if (svgBlobUrl && svgBlobUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(svgBlobUrl);
                    }
                }
            };
            
            // 使用资源管理器创建超时定时器
            let timeoutResource;
            if (resourceManagerLoaded && typeof createManagedTimer === 'function') {
                timeoutResource = createManagedTimer(() => {
                    if (!img.complete) {
                        cleanup();
                        reject(new Error(getTranslation('SVG加载超时')));
                    }
                }, 30000, { taskId: task.id, type: 'svg-timeout' });
                managedResources.push(timeoutResource.resourceId);
            } else {
                // 降级方案：直接使用setTimeout
                setTimeout(() => {
                    if (!img.complete) {
                        cleanup();
                        reject(new Error(getTranslation('SVG加载超时')));
                    }
                }, 30000);
            }
            
            img.onload = function() {
                try {
            // 使用更安全的绘制方法
            ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
            
            // 如果是PNG格式且当前是夜间模式，添加一个半透明白色背景以增强对比度
            if (task.format === 'png') {
                const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || 
                                 (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && 
                                  !document.documentElement.hasAttribute('data-theme'));
                
                if (isDarkMode) {
                    // 添加一个半透明白色背景，使深色SVG在夜间模式下更加可见
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillStyle = 'rgba(248, 250, 252, 0.9)'; // 浅色背景，半透明
                    ctx.fillRect(0, 0, finalWidth, finalHeight);
                    ctx.globalCompositeOperation = 'source-over';
                }
            }
            
            const mimeType = task.format === 'png' ? 'image/png' : 'image/jpeg';
            const qualityValue = task.quality / 10;

                    canvasResource.canvas.toBlob(
                        (blob) => {
                            try {
                                // 清理SVG Blob URL
                                cleanup();
                                
                                if (blob) {
                                    // 使用资源管理器创建结果URL
                                    let resultUrl;
                                    if (resourceManagerLoaded && typeof createManagedBlobUrl === 'function') {
                                        const urlResource = createManagedBlobUrl(blob, { 
                                            taskId: task.id, 
                                            type: 'result',
                                            size: blob.size 
                                        });
                                        managedResources.push(urlResource.resourceId);
                                        resultUrl = urlResource.url;
                                    } else {
                                        // 降级方案：直接创建URL
                                        resultUrl = URL.createObjectURL(blob);
                                    }
                                    
                                    // 始终返回一致的对象格式，包含URL和Blob数据
                                    resolve({ url: resultUrl, blob: blob });
                                } else {
                                    reject(new Error(getTranslation('转换失败')));
                                }
                            } catch (error) {
                                cleanup();
                                reject(new Error(getTranslation('转换过程出错: {error}').replace('{error}', error.message)));
                            }
                        },
                        mimeType,
                        qualityValue
                    );
                } catch (error) {
                    // 清理SVG Blob URL
                    cleanup();
                    reject(new Error(getTranslation('画布绘制失败: {error}').replace('{error}', error.message)));
                }
            };
            
            img.onerror = function() {
                // 清理SVG Blob URL
                cleanup();
                reject(new Error(getTranslation('SVG加载失败')));
            };
            
            img.src = svgBlobUrl;
        } catch (error) {
            console.error('SVG转换过程出错:', error);
            // 清理所有管理的资源
            if (resourceManagerLoaded && typeof releaseResource === 'function') {
                managedResources.forEach(id => {
                    try {
                        releaseResource(id);
                    } catch (e) {
                        console.warn('清理资源失败:', id, e);
                    }
                });
            }
            reject(error);
        }
    });
}

// 转换单个任务
async function handleConvertTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'processing';
    updateTaskUI(task);

    try {
        const result = await convertSvg(task);
        task.status = 'completed';
        // 确保result.url是字符串，如果result是字符串则直接使用
        if (typeof result === 'string') {
            task.resultUrl = result;
            task.resultBlob = null;
        } else if (result && typeof result.url === 'string') {
            task.resultUrl = result.url;
            task.resultBlob = result.blob || null;
        } else {
            console.error('转换结果格式无效:', result, typeof result);
            if (result) {
                console.error('result.url:', result.url, typeof result.url);
                console.error('result.blob:', result.blob, typeof result.blob);
            }
            throw new Error(`转换结果格式无效: ${typeof result}`);
        }
        updateTaskUI(task);
        showToast(getTranslation('{name} 转换完成').replace('{name}', task.name), 'success');
    } catch (error) {
        task.status = 'error';
        task.error = error.message || '转换失败';
        updateTaskUI(task);
        showToast(getTranslation('转换失败: {error}').replace('{error}', task.error), 'error');
    }
    
    updateBatchActionsState();
}

// 批量转换 - 使用并发控制器
async function handleConvertAll() {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) {
        showToast(getTranslation('没有待转换的任务'), 'info');
        return;
    }

    showToast(getTranslation('开始批量转换 {count} 个任务').replace('{count}', pendingTasks.length), 'info');
    
    // 使用并发控制器处理任务
    const taskPromises = pendingTasks.map(async (task) => {
        try {
            // 直接调用convertSvg函数，不使用并发控制器
            const result = await convertSvg(task);
            
            // 直接处理转换结果，不返回中间对象
            task.status = 'completed';
            
            // 确保result.url是字符串，如果result是字符串则直接使用
            if (typeof result === 'string') {
                task.resultUrl = result;
                task.resultBlob = null;
            } else if (result && typeof result.url === 'string') {
                task.resultUrl = result.url;
                task.resultBlob = result.blob || null;
            } else {
                console.error('批量转换结果格式无效:', result, typeof result);
                if (result) {
                    console.error('result.url:', result.url, typeof result.url);
                    console.error('result.blob:', result.blob, typeof result.blob);
                }
                task.status = 'error';
                task.error = `转换结果格式无效: ${typeof result}`;
                throw new Error(`转换结果格式无效: ${typeof result}`);
            }
            
            updateTaskUI(task);
            showToast(getTranslation('{name} 转换完成').replace('{name}', task.name), 'success');
            
            return { task, result, status: 'success' };
        } catch (error) {
            // 处理转换错误
            task.status = 'error';
            task.error = error.message || '转换失败';
            updateTaskUI(task);
            showToast(getTranslation('转换失败: {error}').replace('{error}', task.error), 'error');
            
            return { task, result: null, status: 'error', error };
        }
    });
    
    try {
        // 等待所有任务完成
        const results = await Promise.allSettled(taskPromises);
        
        // 统计结果
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        // 更新批量操作状态
        updateBatchActionsState();
        
        if (failed > 0) {
            showToast(getTranslation('批量转换完成，成功 {success} 个，失败 {failed} 个').replace('{success}', successful).replace('{failed}', failed), 'warning');
        } else {
            showToast(getTranslation('批量转换完成，共 {count} 个文件').replace('{count}', successful), 'success');
        }
    } catch (error) {
        console.error('批量转换过程中出错:', error);
        showToast(getTranslation('批量转换过程中出现错误'), 'error');
    }
}

// 下载单个任务
async function handleDownloadTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.resultUrl) {
        showToast(getTranslation('任务不存在或尚未完成转换'), 'error');
        return;
    }
    
    // 防止重复下载同一任务
    if (downloadingTasks.has(taskId)) {
        showToast(getTranslation('正在下载中，请稍候'), 'info');
        return;
    }
    downloadingTasks.add(taskId);
    
    try {
        // 使用更可靠的下载方法
        const filename = `${task.name.replace('.svg', '')}.${task.format}`;
        
        // 在Chrome扩展环境中，优先使用chrome.downloads API
        if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
            await downloadUsingChromeAPI(task.resultUrl, filename, task.resultBlob);
        } else {
            // 降级到传统下载方法
            traditionalDownload(task.resultUrl, filename);
        }
    } catch (error) {
        console.error('下载时出错:', error);
        showToast(getTranslation('下载失败: {error}').replace('{error}', error.message), 'error');
    } finally {
        // 重置防抖标志
        setTimeout(() => {
            downloadingTasks.delete(taskId);
        }, 1000);
    }
}

// 使用Chrome下载API（在扩展环境中最可靠）
async function downloadUsingChromeAPI(url, filename, blobData = null) {
    try {
        let blobUrl;
        let fetchError = null;
        let shouldCleanupUrl = false;
        
        if (blobData) {
            // 如果有直接提供的Blob数据，使用它创建Blob URL
            blobUrl = URL.createObjectURL(blobData);
            shouldCleanupUrl = true;
        } else if (typeof url === 'string') {
            // 尝试通过fetch获取Blob数据
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`获取文件数据失败: ${response.statusText}`);
                }
                const blob = await response.blob();
                blobUrl = URL.createObjectURL(blob);
                shouldCleanupUrl = true;
            } catch (error) {
                fetchError = error;
                console.warn('通过fetch获取Blob失败，尝试使用原始URL:', error);
                // 如果fetch失败，直接使用原始URL
                blobUrl = url;
                shouldCleanupUrl = false;
            }
        } else {
            // 如果url不是字符串，降级到传统方法
            console.warn('URL不是字符串类型，降级到传统下载方法');
            traditionalDownload(url, filename);
            return;
        }
        
        // 确保blobUrl是字符串
        if (typeof blobUrl !== 'string') {
            console.error('生成的blobUrl不是字符串类型:', typeof blobUrl, blobUrl);
            traditionalDownload(url, filename);
            return;
        }
        
        // 使用Chrome下载API
        const downloadId = await new Promise((resolve, reject) => {
            chrome.downloads.download({
                url: blobUrl,
                filename: filename,
                saveAs: false  // 不显示保存对话框，直接下载
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(downloadId);
                }
            });
        });
        
        // 监听下载完成事件，清理Blob URL
        const downloadListener = (downloadItem) => {
            if (downloadItem.id === downloadId && 
                (downloadItem.state === 'complete' || downloadItem.state === 'interrupted')) {
                // 只有在我们创建了Blob URL时才清理它
                if (shouldCleanupUrl) {
                    URL.revokeObjectURL(blobUrl);
                }
                chrome.downloads.onChanged.removeListener(downloadListener);
                
                if (downloadItem.state === 'complete') {
                    showToast(getTranslation('下载完成: {name}').replace('{name}', filename), 'success');
                } else {
                    showToast(getTranslation('下载失败: {name}').replace('{name}', filename), 'error');
                }
            }
        };
        
        chrome.downloads.onChanged.addListener(downloadListener);
        
        // 设置超时清理，防止监听器永远不会触发
        setTimeout(() => {
            if (shouldCleanupUrl) {
                URL.revokeObjectURL(blobUrl);
            }
            chrome.downloads.onChanged.removeListener(downloadListener);
        }, 30000); // 30秒超时
        
    } catch (error) {
        console.error('Chrome API下载失败:', error);
        // 如果Chrome API失败，降级到传统方法
        traditionalDownload(url, filename);
    }
}

// 传统下载方法（作为备用方案）
function traditionalDownload(url, filename) {
    try {
        // 创建隐藏的下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        // 添加到DOM并触发点击
        document.body.appendChild(a);
        a.click();
        
        // 清理DOM元素
        setTimeout(() => {
            try {
                document.body.removeChild(a);
            } catch (e) {
                console.warn('清理下载链接时出错:', e);
            }
        }, 100);
        
        // 显示下载开始的提示
        showToast(getTranslation('开始下载 {name}').replace('{name}', filename), 'info');
        
        // 设置一个超时检查，因为传统方法无法获取下载状态
        setTimeout(() => {
            showToast(getTranslation('如果下载未开始，请检查浏览器设置'), 'info');
        }, 2000);
        
    } catch (error) {
        console.error('传统下载方法失败:', error);
        showToast(getTranslation('下载失败: {error}').replace('{error}', error.message), 'error');
    }
}// 批量下载
async function handleDownloadAll() {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.resultUrl);
    if (completedTasks.length === 0) {
        showToast(getTranslation('没有可下载的文件'), 'info');
        return;
    }

    showToast(getTranslation('正在下载 {count} 个文件').replace('{count}', completedTasks.length), 'info');
    
    // 在Chrome扩展环境中，尝试使用Chrome API的批量下载
    if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
        try {
            await batchDownloadUsingChromeAPI(completedTasks);
        } catch (error) {
            console.error('Chrome API批量下载失败，使用传统方法:', error);
            // 如果Chrome API失败，降级到传统的逐个下载
            batchDownloadTraditionally(completedTasks);
        }
    } else {
        // 传统环境下的批量下载
        batchDownloadTraditionally(completedTasks);
    }
    
    // 重置文件输入元素，允许重新上传相同文件
    fileInput.value = '';
}

// 使用Chrome API进行批量下载
async function batchDownloadUsingChromeAPI(tasks) {
    const downloadPromises = tasks.map(async (task, index) => {
        // 添加延迟避免浏览器限制
        await new Promise(resolve => setTimeout(resolve, index * 300));
        
        try {
            const filename = `${task.name.replace('.svg', '')}.${task.format}`;
            await downloadUsingChromeAPI(task.resultUrl, filename, task.resultBlob);
            return { success: true, task };
        } catch (error) {
            console.error(`批量下载 ${task.name} 失败:`, error);
            showToast(getTranslation('下载 {name} 失败: {error}').replace('{name}', task.name).replace('{error}', error.message), 'error');
            return { success: false, task, error };
        }
    });
    
    const results = await Promise.allSettled(downloadPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    
    if (failed > 0) {
        showToast(getTranslation('批量下载完成，成功 {success} 个，失败 {failed} 个').replace('{success}', successful).replace('{failed}', failed), 'warning');
    } else {
        showToast(getTranslation('批量下载完成，共 {count} 个文件').replace('{count}', successful), 'success');
    }
}

// 传统批量下载方法
function batchDownloadTraditionally(tasks) {
    tasks.forEach((task, index) => {
        setTimeout(() => {
            try {
                handleDownloadTask(task.id);
            } catch (error) {
                console.error(`传统下载 ${task.name} 失败:`, error);
                showToast(getTranslation('下载 {name} 失败: {error}').replace('{name}', task.name).replace('{error}', error.message), 'error');
            }
        }, index * 500); // 每个文件间隔500ms下载，避免浏览器阻止多个下载
    });
}

// 删除任务
function handleDeleteTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    
    // 释放URL资源
    if (task.resultUrl) {
        try {
            URL.revokeObjectURL(task.resultUrl);
        } catch (error) {
            console.warn('释放URL资源时出错:', error);
        }
    }
    
    // 从任务列表中移除
    tasks.splice(taskIndex, 1);
    
    // 清理防抖标志
    downloadingTasks.delete(taskId);
    
    // 更新UI
    updateUI();
    
    // 显示提示
    showToast(getTranslation('已删除任务: {name}').replace('{name}', task.name), 'success');
}

// 清空所有任务
function handleClearAll() {
    tasks.forEach(task => {
        if (task.resultUrl) {
            URL.revokeObjectURL(task.resultUrl);
        }
    });
    tasks = [];
    // 清理防抖标志
    downloadingTasks.clear();
    
    // 重置文件输入元素，允许重新上传相同文件
    fileInput.value = '';
    
    updateUI();
    showToast(getTranslation('所有任务已清除'), 'info');
}

// 获取状态图标
function getStatusIcon(status) {
    switch (status) {
        case 'pending':
            return `<svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
        case 'processing':
            return `<svg class="w-4 h-4 text-primary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>`;
        case 'completed':
            return `<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
        case 'error':
            return `<svg class="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
    }
}

// 获取分辨率标签（已翻译）
function getResolutionLabel(value) {
    const option = resolutionOptions.find(r => r.value === value);
    return option ? getTranslation(option.label) : '';
}

// 获取翻译文本
function getTranslation(key) {
    // 使用共享的翻译系统
    if (typeof LanguageSwitch !== 'undefined' && LanguageSwitch.getTranslation) {
        return LanguageSwitch.getTranslation(key);
    }
    // 如果翻译系统不可用，则返回原始键
    return key;
}

// 获取状态文本
function getStatusText(status) {
    switch (status) {
        case 'pending': return getTranslation('等待中');
        case 'processing': return getTranslation('转换中');
        case 'completed': return getTranslation('已完成');
        case 'error': return getTranslation('失败');
    }
}

// 更新UI
function updateUI() {
    taskCount.textContent = tasks.length;
    
    // 更新任务列表标题
    updateTaskListTitle();
    
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
        taskList.style.display = 'none';
        batchActions.classList.remove('visible');
        clearAll.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        taskList.style.display = 'block';
        batchActions.classList.add('visible');
        clearAll.style.display = 'inline-flex';
        renderTasks();
        updateBatchActionsState();
    }
}

// 渲染任务列表
function renderTasks() {
    taskList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.status === 'error' ? 'error' : ''}">
            <div class="task-icon ${task.status}">
                ${getStatusIcon(task.status)}
            </div>
            <div class="task-info">
                <div class="task-name" title="${task.name}">${task.name}</div>
                <div class="task-status">
                    <span>${getStatusText(task.status)}</span>
                    <span>•</span>
                    <span>${task.format.toUpperCase()}</span>
                    <span>•</span>
                    <span>${getResolutionLabel(task.resolution)}</span>
                </div>
                ${task.error ? `<p class="task-error" title="${task.error}">${task.error}</p>` : ''}
            </div>
            <button
                type="button"
                class="delete-task-btn"
                data-task-id="${task.id}"
                data-action="delete"
            >
                <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
            <div class="task-actions">
                ${task.status === 'pending' ? `
                    <button
                        type="button"
                        class="btn btn-primary"
                        data-task-id="${task.id}"
                        data-action="convert"
                    >
                        ${getTranslation('转换')}
                    </button>
                ` : ''}
                
                ${task.status === 'completed' && task.resultUrl ? `
                    <button
                        type="button"
                        class="btn btn-primary"
                        data-task-id="${task.id}"
                        data-action="download"
                    >
                        <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        ${getTranslation('下载')}
                    </button>
                ` : ''}
                
                ${task.status === 'error' ? `
                    <button
                        type="button"
                        class="btn btn-secondary"
                        data-task-id="${task.id}"
                        data-action="convert"
                    >
                        ${getTranslation('重试')}
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// 更新任务UI
function updateTaskUI(updatedTask) {
    const task = tasks.find(t => t.id === updatedTask.id);
    if (!task) return;
    
    Object.assign(task, updatedTask);
    renderTasks();
    updateBatchActionsState();
}

// 更新批量操作按钮状态
function updateBatchActionsState() {
    const hasPending = tasks.some(t => t.status === 'pending');
    const hasCompleted = tasks.some(t => t.status === 'completed' && t.resultUrl);
    
    convertAll.disabled = !hasPending;
    downloadAll.disabled = !hasCompleted;
    
    if (hasPending) {
        convertAll.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        convertAll.classList.add('opacity-50', 'cursor-not-allowed');
    }
    
    if (hasCompleted) {
        downloadAll.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        downloadAll.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// 显示提示消息
function showToast(description, variant = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${variant === 'destructive' ? 'toast-destructive' : ''}`;
    
    const title = variant === 'error' ? getTranslation('错误') : 
                  variant === 'success' ? getTranslation('成功') : getTranslation('提示');
    
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-description">${description}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // 触发显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 3秒后自动移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}