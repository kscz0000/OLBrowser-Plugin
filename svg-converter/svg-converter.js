// DOM元素引用
const svgText = document.getElementById('svgText');
const addTextTaskBtn = document.getElementById('addTextTask');
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const outputFormat = document.getElementById('outputFormat');
const resolution = document.getElementById('resolution');
const quality = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const qualityText = document.getElementById('qualityText');
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
dropArea.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('dragover', handleDragOver);
dropArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileUpload);
outputFormat.addEventListener('change', handleFormatChange);
quality.addEventListener('input', handleQualityChange);
convertAll.addEventListener('click', handleConvertAll);
downloadAll.addEventListener('click', handleDownloadAll);
clearAll.addEventListener('click', handleClearAll);

// 初始化
updateQualityVisibility();

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
        showToast('请输入SVG代码', 'error');
        return;
    }

    try {
        parseSvgDimensions(text);
        const task = createTask(`SVG文本_${tasks.length + 1}`, text);
        tasks.push(task);
        svgText.value = '';
        updateUI();
        showToast('已添加到任务列表', 'success');
    } catch (error) {
        showToast(error.message || '无效的SVG内容', 'error');
    }
}

// 处理文件上传
function handleFileUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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
                        showToast(`已添加 ${newTasks.length} 个文件到任务列表`, 'success');
                    }
                } catch (error) {
                    showToast(`文件 ${file.name} 无效`, 'error');
                    processedCount++;
                    if (processedCount === files.length) {
                        updateUI();
                    }
                }
            };
            reader.readAsText(file);
        } else {
            showToast(`文件 ${file.name} 不是SVG格式`, 'error');
            processedCount++;
            if (processedCount === files.length) {
                updateUI();
            }
        }
    });
}

// 拖拽处理
function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        handleFileUpload({ target: { files } });
    }
}

// 格式变更处理
function handleFormatChange() {
    updateQualityVisibility();
}

// 质量滑块变更处理
function handleQualityChange() {
    qualityValue.textContent = quality.value;
    updateQualityText(quality.value);
}

// 创建任务对象
function createTask(name, svgContent) {
    return {
        id: `task_${++taskIdCounter}`,
        name,
        svgContent,
        status: 'pending',
        format: outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value,
        quality: parseInt(quality.value),
        resolution: parseInt(resolution.value),
        resultUrl: null,
        error: null
    };
}

// 解析SVG尺寸
function parseSvgDimensions(svgContent) {
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

// 转换单个SVG - 修复浏览器安全策略问题
async function convertSvg(task) {
    return new Promise((resolve, reject) => {
        try {
            const { width, height } = parseSvgDimensions(task.svgContent);
            const scaledWidth = Math.floor(width * task.resolution);
            const scaledHeight = Math.floor(height * task.resolution);

            // 确保尺寸在合理范围内
            const finalWidth = Math.min(Math.max(scaledWidth, 1), 16384);
            const finalHeight = Math.min(Math.max(scaledHeight, 1), 16384);

            const canvas = document.createElement('canvas');
            canvas.width = finalWidth;
            canvas.height = finalHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                throw new Error('无法创建Canvas上下文');
            }

            // 清空画布
            ctx.clearRect(0, 0, finalWidth, finalHeight);

            // 为JPG格式添加白色背景
            if (task.format === 'jpg' || task.format === 'jpeg') {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, finalWidth, finalHeight);
            }

            // 创建安全的SVG字符串，避免潜在的安全问题
            let safeSvgContent = task.svgContent;
            
            // 移除可能的脚本和危险内容
            safeSvgContent = safeSvgContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            safeSvgContent = safeSvgContent.replace(/on\w+="[^"]*"/gi, '');
            safeSvgContent = safeSvgContent.replace(/javascript:/gi, '');

            // 确保SVG有命名空间
            if (!safeSvgContent.includes('xmlns="http://www.w3.org/2000/svg"')) {
                safeSvgContent = safeSvgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
            }

            // 使用更安全的方法：将SVG转换为Data URL
            const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(safeSvgContent)));
            
            const img = new Image();
            
            img.onload = function() {
                try {
                    // 使用更安全的绘制方法
                    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
                    
                    const mimeType = task.format === 'png' ? 'image/png' : 'image/jpeg';
                    const qualityValue = task.quality / 10;

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const resultUrl = URL.createObjectURL(blob);
                                resolve(resultUrl);
                            } else {
                                reject(new Error('转换失败'));
                            }
                        },
                        mimeType,
                        qualityValue
                    );
                } catch (error) {
                    reject(new Error(`画布绘制失败: ${error.message}`));
                }
            };
            
            img.onerror = function() {
                reject(new Error('SVG加载失败'));
            };
            
            // 设置超时
            setTimeout(() => {
                if (!img.complete) {
                    reject(new Error('SVG加载超时'));
                }
            }, 30000);
            
            img.src = svgDataUri;
        } catch (error) {
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
        const resultUrl = await convertSvg(task);
        task.status = 'completed';
        task.resultUrl = resultUrl;
        updateTaskUI(task);
        showToast(`${task.name} 转换完成`, 'success');
    } catch (error) {
        task.status = 'error';
        task.error = error.message || '转换失败';
        updateTaskUI(task);
        showToast(`转换失败: ${task.error}`, 'error');
    }
    
    updateBatchActionsState();
}

// 批量转换
async function handleConvertAll() {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) {
        showToast('没有待转换的任务', 'info');
        return;
    }

    showToast(`开始批量转换 ${pendingTasks.length} 个任务`, 'info');
    
    for (const task of pendingTasks) {
        await handleConvertTask(task.id);
    }
}

// 下载单个任务
function handleDownloadTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.resultUrl) return;
    
    // 防止重复下载同一任务
    if (downloadingTasks.has(taskId)) {
        return;
    }
    downloadingTasks.add(taskId);
    
    // 重置防抖标志
    setTimeout(() => {
        downloadingTasks.delete(taskId);
    }, 300);

    try {
        // 创建一个更可靠的下载方法
        const a = document.createElement('a');
        a.href = task.resultUrl;
        a.download = `${task.name.replace('.svg', '')}.${task.format}`;
        a.style.display = 'none';
        
        // 确保链接添加到DOM中
        document.body.appendChild(a);
        
        // 使用单一方式触发下载，避免重复下载
        setTimeout(() => {
            try {
                // 只使用一种方法触发下载
                a.click();
                showToast(`开始下载 ${task.name}`, 'success');
            } catch (error) {
                console.error('下载错误:', error);
                showToast(`下载失败: ${error.message}`, 'error');
            }
            
            // 清理DOM元素
            setTimeout(() => {
                try {
                    document.body.removeChild(a);
                } catch (e) {
                    // 忽略清理错误
                    console.warn('清理下载链接时出错:', e);
                }
            }, 100);
        }, 50);
    } catch (error) {
        console.error('创建下载链接时出错:', error);
        showToast(`下载失败: ${error.message}`, 'error');
    }
}

// 批量下载
function handleDownloadAll() {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.resultUrl);
    if (completedTasks.length === 0) {
        showToast('没有可下载的文件', 'info');
        return;
    }

    showToast(`正在下载 ${completedTasks.length} 个文件`, 'info');
    
    completedTasks.forEach((task, index) => {
        setTimeout(() => {
            try {
                handleDownloadTask(task.id);
            } catch (error) {
                console.error(`下载 ${task.name} 失败:`, error);
                showToast(`下载 ${task.name} 失败: ${error.message}`, 'error');
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
    showToast(`已删除任务: ${task.name}`, 'success');
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
    updateUI();
    showToast('所有任务已清除', 'info');
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

// 获取状态文本
function getStatusText(status) {
    switch (status) {
        case 'pending': return '等待中';
        case 'processing': return '转换中';
        case 'completed': return '已完成';
        case 'error': return '失败';
    }
}

// 更新质量显示可见性
function updateQualityVisibility() {
    const isJpeg = outputFormat.value === 'jpeg';
    qualityContainer.style.display = isJpeg ? 'block' : 'none';
    updateQualityText(quality.value);
}

// 更新质量文本
function updateQualityText(value) {
    if (value <= 3) {
        qualityText.textContent = ' (低质量)';
    } else if (value <= 7) {
        qualityText.textContent = ' (中等质量)';
    } else {
        qualityText.textContent = ' (高质量)';
    }
}

// 更新UI
function updateUI() {
    taskCount.textContent = tasks.length;
    
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
        taskList.style.display = 'none';
        batchActions.style.display = 'none';
        clearAll.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        taskList.style.display = 'block';
        batchActions.style.display = 'flex';
        clearAll.style.display = 'inline-flex';
        renderTasks();
        updateBatchActionsState();
    }
}

// 渲染任务列表
function renderTasks() {
    taskList.innerHTML = tasks.map(task => `
        <div class="border border-border rounded-md p-4">
            <div class="space-y-3">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <p class="font-medium truncate">${task.name}</p>
                        <div class="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            ${getStatusIcon(task.status)}
                            <span>${getStatusText(task.status)}</span>
                            <span>•</span>
                            <span>${task.format.toUpperCase()}</span>
                            <span>•</span>
                            <span>${resolutionOptions.find(r => r.value === task.resolution)?.label}</span>
                        </div>
                        ${task.error ? `<p class="text-sm text-destructive mt-1">${task.error}</p>` : ''}
                    </div>
                    <button
                        type="button"
                        class="p-1 rounded hover:bg-muted transition-colors"
                        data-task-id="${task.id}"
                        data-action="delete"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="flex gap-2">
                    ${task.status === 'pending' ? `
                        <button
                            type="button"
                            class="flex-1 bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium hover:bg-primary/90 transition-colors"
                            data-task-id="${task.id}"
                            data-action="convert"
                        >
                            转换
                        </button>
                    ` : ''}
                    
                    ${task.status === 'completed' && task.resultUrl ? `
                        <button
                            type="button"
                            class="flex-1 bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                            data-task-id="${task.id}"
                            data-action="download"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                            下载
                        </button>
                    ` : ''}
                    
                    ${task.status === 'error' ? `
                        <button
                            type="button"
                            class="flex-1 border border-border bg-background text-foreground px-3 py-1 rounded text-sm font-medium hover:bg-muted transition-colors"
                            data-task-id="${task.id}"
                            data-action="convert"
                        >
                            重试
                        </button>
                    ` : ''}
                </div>
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
    
    const title = variant === 'error' ? '错误' : 
                  variant === 'success' ? '成功' : '提示';
    
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