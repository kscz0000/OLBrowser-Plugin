// 图像压缩工具 - 重构版主逻辑

document.addEventListener('DOMContentLoaded', function() {
    // DOM元素引用
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const sizeSlider = document.getElementById('sizeSlider');
    const sizeValue = document.getElementById('sizeValue');
    const formatOptions = document.querySelectorAll('.format-option');
    const sizePresets = document.querySelectorAll('.size-preset');
    const compressBtn = document.getElementById('compressBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsList = document.getElementById('resultsList');
    const toastContainer = document.getElementById('toastContainer');

    // 安全模块加载状态
    let fileValidatorLoaded = false;
    let secureStorageLoaded = false;
    let resourceManagerLoaded = false;

    // 检查安全模块是否已加载
    function checkSecurityModules() {
        fileValidatorLoaded = typeof FileValidator !== 'undefined';
        secureStorageLoaded = typeof SecureStorage !== 'undefined';
        resourceManagerLoaded = typeof ResourceManager !== 'undefined';
        
        if (!fileValidatorLoaded) {
            console.warn('文件验证模块未加载，安全性降低');
        }
        if (!secureStorageLoaded) {
            console.warn('安全存储模块未加载，安全性降低');
        }
        if (!resourceManagerLoaded) {
            console.warn('资源管理模块未加载，内存管理可能受影响');
        }
    }

    // 状态变量
    let selectedFiles = [];
    let renderedResults = []; // 存储已渲染的结果项
    let selectedFormat = 'png';
    let compressionQuality = 80;
    let sizeMode = 0; // 0=自动, 1=75%, 2=50%, 3=25%, 4=1920px, 5=1280px

    // 事件监听器设置
    setupEventListeners();
    
    // 初始化尺寸预设按钮
    initializeSizePresets();
    
    // 初始化函数
    function initializeSizePresets() {
        // 默认选中第一个预设（自动模式）
        if (sizePresets.length > 0) {
            sizePresets[0].classList.add('active');
        }
        
        // 初始化滑块背景
        updateSliderBackground(qualitySlider);
        updateSliderBackground(sizeSlider);
        
        // 根据当前语言初始化按钮文本
        if (typeof LanguageSwitch !== 'undefined') {
            const currentLang = LanguageSwitch.getCurrentLanguage();
            if (currentLang !== 'zh') {
                // 更新按钮文本
                compressBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    ${getTranslation('开始压缩')}
                `;
                
                clearBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    ${getTranslation('清空列表')}
                `;
                
                // 更新标题文本
                const resultsTitle = resultsContainer.querySelector('h3');
                if (resultsTitle) {
                    resultsTitle.textContent = getTranslation('压缩结果');
                }
                
                // 更新所有下载按钮的文本
                document.querySelectorAll('.result-item button, .result-item.error button').forEach(btn => {
                    if (btn.textContent.trim() === '下载' || btn.textContent.trim() === 'Download') {
                        btn.textContent = getTranslation('下载');
                    }
                });
            }
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

    // 设置事件监听器
    function setupEventListeners() {
        // 文件输入事件
        fileInput.addEventListener('change', handleFileSelect);

        // 拖拽事件
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);

        // 滑块事件
        qualitySlider.addEventListener('input', updateQualityValue);
        sizeSlider.addEventListener('input', updateSizeMode);

        // 格式选择事件
        formatOptions.forEach(option => {
            option.addEventListener('click', function() {
                formatOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                selectedFormat = this.getAttribute('data-format');
            });
        });

        // 尺寸预设事件
        sizePresets.forEach(preset => {
            preset.addEventListener('click', function() {
                sizePresets.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                sizeSlider.value = this.getAttribute('data-size');
                updateSizeMode();
            });
        });

        // 压缩按钮事件
        compressBtn.addEventListener('click', async function(e) {
            createRippleEffect(compressBtn);
            await compressImagesWithConcurrencyControl();
        });

        // 清空按钮事件
        clearBtn.addEventListener('click', function(e) {
            createRippleEffect(clearBtn);
            clearFileList();
        });
    }

    // 处理文件选择
    async function handleFileSelect(event) {
        const files = Array.from(event.target.files);
        await addFilesToList(files);
    }

    // 处理拖拽事件
    function handleDragOver(event) {
        event.preventDefault();
        uploadArea.classList.add('drag-over');
    }

    function handleDragLeave(event) {
        event.preventDefault();
        uploadArea.classList.remove('drag-over');
    }

    async function handleDrop(event) {
        event.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files);
        await addFilesToList(files);
    }

    // 添加文件到列表
    async function addFilesToList(files) {
        // 如果文件验证模块可用，使用它进行验证
        if (fileValidatorLoaded) {
            try {
                const validation = await FileValidator.validateMultipleFiles(files);
                
                // 处理无效文件
                if (validation.invalidFiles.length > 0) {
                    validation.invalidFiles.forEach(({ file, errors, warnings }) => {
                        // 显示错误
                        const errorMessage = errors.length > 0 ? errors.join(', ') : '文件验证失败';
                        showToast(`${file.name}: ${errorMessage}`, 'error');
                        
                        // 显示警告（如果有）
                        if (warnings.length > 0) {
                            console.warn(`${file.name} 警告:`, warnings);
                        }
                    });
                }
                
                // 处理有效文件
                if (validation.validFiles.length > 0) {
                    // 检查文件是否已存在
                    const newFiles = validation.validFiles.filter(file => 
                        !selectedFiles.some(f => f.name === file.name && f.size === file.size)
                    );
                    
                    // 添加到文件列表
                    selectedFiles.push(...newFiles);
                    newFiles.forEach(file => renderFileItem(file));
                    
                    if (newFiles.length > 0) {
                        showToast(`已添加 ${newFiles.length} 个有效文件`, 'success');
                    }
                }
            } catch (error) {
                console.error('文件验证过程出错:', error);
                showToast('文件验证失败，使用降级方案', 'error');
                // 降级到原始验证方法
                fallbackFileValidation(files);
            }
        } else {
            // 降级方案：使用原始验证方法
            fallbackFileValidation(files);
        }
    }
    
    // 降级文件验证方法
    function fallbackFileValidation(files) {
        files.forEach(file => {
            // 检查文件类型
            if (!file.type.match('image.*')) {
                showToast(`文件 ${file.name} 不是有效的图像文件`, 'error');
                return;
            }

            // 检查是否为支持的格式
            const supportedFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            if (!supportedFormats.includes(fileExtension)) {
                showToast(`文件 ${file.name} 不是支持的图像格式，请使用 PNG, JPG, JPEG, WebP, GIF 或 BMP 格式`, 'error');
                return;
            }

            // 检查是否已存在
            if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                selectedFiles.push(file);
                renderFileItem(file);
            }
        });
    }

    // 渲染文件项
    function renderFileItem(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        // 截断文件名并添加完整文件名到title属性
        const truncatedFileName = truncateFileName(file.name, 40);
        
        fileItem.innerHTML = `
            <div class="file-icon-cell">
                <svg class="file-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <div class="file-name-cell">
                <span class="file-name" title="${file.name}">${truncatedFileName}</span>
            </div>
            <div class="file-size-cell">
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
            <div class="remove-file-cell">
                <button class="remove-file">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `;

        // 添加删除事件
        const removeBtn = fileItem.querySelector('.remove-file');
        removeBtn.addEventListener('click', () => {
            selectedFiles = selectedFiles.filter(f => f !== file);
            fileItem.remove();
        });

        fileList.appendChild(fileItem);
    }
    
    // 截断文件名函数，保留扩展名
    function truncateFileName(fileName, maxLength) {
        if (fileName.length <= maxLength) {
            return fileName;
        }
        
        const parts = fileName.split('.');
        const extension = parts.length > 1 ? parts.pop() : '';
        const nameWithoutExt = parts.join('.');
        
        // 如果只有扩展名超长，优先保留更多文件名
        const maxNameLength = Math.max(10, maxLength - extension.length - 5);
        
        if (nameWithoutExt.length <= maxNameLength) {
            return fileName;
        }
        
        const truncatedName = nameWithoutExt.substring(0, maxNameLength) + '...';
        return extension ? truncatedName + '.' + extension : truncatedName;
    }

    // 更新压缩质量显示
    function updateQualityValue() {
        compressionQuality = qualitySlider.value;
        qualityValue.textContent = `${compressionQuality}%`;
        updateSliderBackground(qualitySlider);
    }
    
    // 更新尺寸模式显示
    function updateSizeMode() {
        sizeMode = parseInt(sizeSlider.value);
        
        // 更新预设按钮状态
        sizePresets.forEach(p => p.classList.remove('active'));
        sizePresets.forEach(p => {
            if (parseInt(p.dataset.size) === sizeMode) {
                p.classList.add('active');
            }
        });
        
        // 更新显示文本
        const sizeLabels = ['自动', '75%', '50%', '25%', '1920px', '1280px'];
        sizeValue.textContent = sizeLabels[sizeMode];
        
        // 更新滑块背景
        updateSliderBackground(sizeSlider);
    }

    // 监听窗口resize事件，重新调整滑块背景
    window.addEventListener('resize', function() {
        updateSliderBackground(qualitySlider);
        updateSliderBackground(sizeSlider);
    });
    
    // 统一的UI更新函数，避免代码重复
    function updateUIAfterLanguageChange() {
        // 更新滑块背景
        updateSliderBackground(qualitySlider);
        updateSliderBackground(sizeSlider);
        
        // 更新按钮文本
        compressBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            ${getTranslation('开始压缩')}
        `;
        
        clearBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            ${getTranslation('清空列表')}
        `;
        
        // 更新标题文本
        const resultsTitle = resultsContainer.querySelector('h3');
        if (resultsTitle) {
            resultsTitle.textContent = getTranslation('压缩结果');
        }
        
        // 更新所有下载按钮的文本
        document.querySelectorAll('.result-item button, .result-item.error button').forEach(btn => {
            if (btn.textContent.trim() === '下载' || btn.textContent.trim() === 'Download') {
                btn.textContent = getTranslation('下载');
            }
        });
        
        // 重新渲染所有结果项以应用翻译
        rerenderResults();
        
        // 触发窗口resize事件，确保其他组件也重新调整
        window.dispatchEvent(new Event('resize'));
    }

    // 监听语言切换事件，确保布局正确调整
    window.addEventListener('languageChanged', function() {
        // 延迟执行以确保翻译完成
        setTimeout(updateUIAfterLanguageChange, 200);
    });
    
    // 添加DOM内容变化监听器，作为备用方案
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                // 检查是否有文本内容变化
                if (renderedResults.length > 0) {
                    // 延迟执行以确保翻译完成，使用统一的UI更新函数
                    setTimeout(updateUIAfterLanguageChange, 100);
                }
            }
        });
    });
    
    // 配置观察选项
    const config = { 
        attributes: true, 
        childList: true, 
        subtree: true,
        characterData: true
    };
    
    // 开始观察
    observer.observe(document.body, config);
    
    // 异步版本的图像处理函数
    async function processImageAsync(file) {
        const managedResources = [];
        
        // 获取原始文件格式
        const originalFormat = file.name.split('.').pop().toLowerCase();
        
        // 检查是否需要智能压缩（避免同格式无损压缩导致文件变大）
        const needsSmartCompression = shouldApplySmartCompression(originalFormat, selectedFormat, compressionQuality);
        
        try {
            // 使用createImageBitmap创建图像位图，更节省内存
            const bitmap = await createImageBitmap(file);
            
            try {
                // 使用资源管理器创建canvas
                let canvasResource;
                let ctx;
                if (resourceManagerLoaded) {
                    const { width, height } = calculateOptimizedDimensions(bitmap.width, bitmap.height, compressionQuality, sizeMode);
                    canvasResource = createManagedCanvas(width, height, { 
                        fileName: file.name,
                        originalFormat,
                        targetFormat: selectedFormat 
                    });
                    managedResources.push(canvasResource.resourceId);
                    ctx = canvasResource.canvas.getContext('2d');
                } else {
                    // 降级方案：直接创建Canvas
                    canvasResource = { canvas: document.createElement('canvas') };
                    const { width, height } = calculateOptimizedDimensions(bitmap.width, bitmap.height, compressionQuality, sizeMode);
                    canvasResource.canvas.width = width;
                    canvasResource.canvas.height = height;
                    ctx = canvasResource.canvas.getContext('2d');
                }
                
                // 使用优化的绘制方法
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = compressionQuality > 70 ? 'high' : 'medium';
                
                // 绘制图像到canvas
                ctx.drawImage(bitmap, 0, 0, canvasResource.canvas.width, canvasResource.canvas.height);
                
                // 应用额外的压缩技术
                if (selectedFormat === 'jpeg' || selectedFormat === 'webp') {
                    applyAdvancedCompression(ctx, canvasResource.canvas.width, canvasResource.canvas.height, compressionQuality);
                }
                
                // 根据选择的格式和质量进行压缩
                let mimeType = 'image/jpeg';
                if (selectedFormat === 'png') {
                    mimeType = 'image/png';
                } else if (selectedFormat === 'webp') {
                    mimeType = 'image/webp';
                } else if (selectedFormat === 'gif') {
                    mimeType = 'image/gif';
                } else if (selectedFormat === 'bmp') {
                    mimeType = 'image/bmp';
                }
                
                // 将质量转换为0-1范围，对于智能压缩应用调整
                const quality = needsSmartCompression ? getAdjustedQuality(compressionQuality, originalFormat, selectedFormat) : compressionQuality / 100;
                
                // 转换为blob
                const blob = await new Promise((resolve, reject) => {
                    canvasResource.canvas.toBlob(resolve, mimeType, quality);
                });
                
                // 释放内存
                bitmap.close();
                
                // 如果智能压缩后文件仍然变大，使用原始文件
                if (needsSmartCompression && blob.size >= file.size) {
                    // 清理所有管理的资源
                    if (resourceManagerLoaded) {
                        managedResources.forEach(id => releaseResource(id));
                    }
                    await createDirectResultAsync(file);
                    return;
                }
                
                // 使用资源管理器创建结果URL
                let resultUrl;
                if (resourceManagerLoaded) {
                    const urlResource = createManagedBlobUrl(blob, { 
                        fileName: file.name,
                        originalFormat,
                        targetFormat: selectedFormat,
                        size: blob.size 
                    });
                    managedResources.push(urlResource.resourceId);
                    resultUrl = urlResource.url;
                } else {
                    // 降级方案：直接创建URL
                    resultUrl = URL.createObjectURL(blob);
                }
                
                // 创建压缩后的结果对象
                const saved = file.size - blob.size;
                const result = {
                    originalName: file.name,
                    compressedName: file.name.replace(/\.[^/.]+$/, `.${selectedFormat}`),
                    originalSize: file.size,
                    compressedSize: blob.size,
                    saved: saved,
                    effectiveCompression: saved > 0, // 是否有效压缩
                    blob: blob,
                    url: resultUrl
                };
                
                // 渲染结果
                renderResult(result);
                
                // 注意：不在这里重置fileInput，因为这会影响批量处理
                // fileInput.value = '';
            } catch (error) {
                console.error('Error processing image:', error);
                // 确保bitmap被释放
                if (bitmap) {
                    bitmap.close();
                }
                
                // 清理所有管理的资源
                if (resourceManagerLoaded) {
                    managedResources.forEach(id => releaseResource(id));
                }
                
                // 注意：不在这里重置fileInput，因为这会影响批量处理
                // fileInput.value = '';
            }
        } catch (error) {
            console.error('Error loading image:', error);
            // 清理所有管理的资源
            if (resourceManagerLoaded) {
                managedResources.forEach(id => releaseResource(id));
            }
            // 回退到FileReader方法
            fallbackImageProcessing(file, () => {}); // 使用空的回调函数，因为async版本不需要回调
        }
    }

    // 判断是否需要智能压缩
    function shouldApplySmartCompression(originalFormat, targetFormat, quality) {
        // 高质量设置（>90%）的同格式转换不需要智能压缩
        if (quality > 90 && originalFormat === targetFormat) {
            return false;
        }
        
        // PNG到PNG的压缩可能导致文件变大，需要智能压缩
        if (originalFormat === 'png' && targetFormat === 'png') {
            return true;
        }
        
        // 高质量JPEG到JPEG可能导致文件变大
        if (originalFormat === 'jpeg' && targetFormat === 'jpeg' && quality > 80) {
            return true;
        }
        
        return false;
    }

    // 获取调整后的质量参数
    function getAdjustedQuality(quality, originalFormat, targetFormat) {
        // 对于可能导致文件变大的情况，降低质量参数
        if (originalFormat === 'png' && targetFormat === 'png') {
            return Math.min(quality * 0.8, 70) / 100; // PNG质量限制在70%
        }
        
        if (originalFormat === 'jpeg' && targetFormat === 'jpeg') {
            return Math.min(quality * 0.9, 85) / 100; // JPEG质量限制在85%
        }
        
        return quality / 100;
    }

    // 创建涟漪效果
    function createRippleEffect(element) {
        element.classList.add('ripple');
        
        setTimeout(() => {
            element.classList.remove('ripple');
        }, 600);
    }
    
    // 异步版本的创建直接使用原始文件的结果
    async function createDirectResultAsync(file) {
        // 使用资源管理器创建URL
        let resultUrl;
        if (resourceManagerLoaded) {
            const urlResource = createManagedBlobUrl(file, { 
                fileName: file.name,
                type: 'original',
                size: file.size,
                directCopy: true 
            });
            resultUrl = urlResource.url;
        } else {
            // 降级方案：直接创建URL
            resultUrl = URL.createObjectURL(file);
        }
        
        // 创建结果对象
        const result = {
            originalName: file.name,
            compressedName: file.name,
            originalSize: file.size,
            compressedSize: file.size,
            saved: 0,
            effectiveCompression: false, // 未压缩
            blob: file,
            url: resultUrl
        };
        
        // 渲染结果
        renderResult(result);
    }

    // 创建直接使用原始文件的结果（降级方案）
    function createDirectResult(file, onComplete) {
        // 创建URL
        const url = URL.createObjectURL(file);
        
        // 创建结果对象
        const result = {
            originalName: file.name,
            compressedName: file.name,
            originalSize: file.size,
            compressedSize: file.size,
            saved: 0,
            effectiveCompression: false, // 未压缩
            blob: file,
            url: url
        };
        
        // 渲染结果
        renderResult(result);
        
        // 完成回调
        if (onComplete) onComplete();
    }

    // 计算优化的尺寸
    function calculateOptimizedDimensions(originalWidth, originalHeight, quality, sizeMode) {
        let width = originalWidth;
        let height = originalHeight;
        
        // 根据尺寸模式调整
        switch (sizeMode) {
            case 1: // 75%
                width = Math.round(originalWidth * 0.75);
                height = Math.round(originalHeight * 0.75);
                break;
            case 2: // 50%
                width = Math.round(originalWidth * 0.5);
                height = Math.round(originalHeight * 0.5);
                break;
            case 3: // 25%
                width = Math.round(originalWidth * 0.25);
                height = Math.round(originalHeight * 0.25);
                break;
            case 4: // 1920px
                if (originalWidth > 1920) {
                    const ratio = 1920 / originalWidth;
                    width = 1920;
                    height = Math.round(originalHeight * ratio);
                }
                break;
            case 5: // 1280px
                if (originalWidth > 1280) {
                    const ratio = 1280 / originalWidth;
                    width = 1280;
                    height = Math.round(originalHeight * ratio);
                }
                break;
        }
        
        return { width, height };
    }

    // 应用高级压缩技术
    function applyAdvancedCompression(ctx, width, height, quality) {
        // 对于高质量图像，应用锐化滤镜以保持清晰度
        if (quality > 80) {
            // 简单的锐化效果
            ctx.filter = 'contrast(1.05) saturate(1.1)';
        } else if (quality < 30) {
            // 对于低质量图像，应用轻微模糊以减少噪点
            ctx.filter = 'blur(0.5px)';
        }
    }

    // 降级的图像处理方法（使用FileReader）
    function fallbackImageProcessing(file, onComplete) {
        const reader = new FileReader();
        const img = new Image();
        
        reader.onload = function(e) {
            img.onload = function() {
                try {
                    // 创建canvas
                    const canvas = document.createElement('canvas');
                    const { width, height } = calculateOptimizedDimensions(img.width, img.height, compressionQuality, sizeMode);
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 绘制图像
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = compressionQuality > 70 ? 'high' : 'medium';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 应用压缩技术
                    applyAdvancedCompression(ctx, width, height, compressionQuality);
                    
                    // 根据选择的格式和质量进行压缩
                    let mimeType = 'image/jpeg';
                    if (selectedFormat === 'png') {
                        mimeType = 'image/png';
                    } else if (selectedFormat === 'webp') {
                        mimeType = 'image/webp';
                    } else if (selectedFormat === 'gif') {
                        mimeType = 'image/gif';
                    } else if (selectedFormat === 'bmp') {
                        mimeType = 'image/bmp';
                    }
                    
                    // 转换为blob
                    canvas.toBlob(function(blob) {
                        if (blob) {
                            // 创建URL
                            const url = URL.createObjectURL(blob);
                            
                            // 创建结果对象
                            const saved = file.size - blob.size;
                            const result = {
                                originalName: file.name,
                                compressedName: file.name.replace(/\.[^/.]+$/, `.${selectedFormat}`),
                                originalSize: file.size,
                                compressedSize: blob.size,
                                saved: saved,
                                effectiveCompression: saved > 0,
                                blob: blob,
                                url: url
                            };
                            
                            // 渲染结果
                            renderResult(result);
                            
                            // 完成回调
                            if (onComplete) onComplete();
                        } else {
                            // 如果压缩失败，直接使用原始文件
                            createDirectResult(file, onComplete);
                        }
                        
                        // 注意：不在这里重置fileInput，因为这会影响批量处理
                        // fileInput.value = '';
                    }, mimeType, compressionQuality / 100);
                } catch (error) {
                    console.error('Fallback processing error:', error);
                    // 如果处理失败，直接使用原始文件
                    createDirectResult(file, onComplete);
                }
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    // 渲染结果
    function renderResult(result) {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${result.effectiveCompression ? '' : 'warning'}`;
        
        // 截断文件名并添加完整文件名到title属性
        const originalDisplay = truncateFileName(result.originalName, 30);
        const compressedDisplay = truncateFileName(result.compressedName, 30);
        const fullName = `${result.originalName} → ${result.compressedName}`;
        const displayName = `${originalDisplay} → ${compressedDisplay}`;
        
        // 计算压缩率
        const compressionRatio = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1);
        
        resultItem.innerHTML = `
            <div class="result-icon ${result.effectiveCompression ? 'success' : 'warning'}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${result.effectiveCompression ? 
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />' :
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />'
                    }
                </svg>
            </div>
            <div class="result-info">
                <div class="result-name" title="${fullName}">${displayName}</div>
                <div class="result-details" title="">${getTranslation('原始大小')}: ${formatFileSize(result.originalSize)} | ${getTranslation('压缩后')}: ${formatFileSize(result.compressedSize)}${result.effectiveCompression ? ` | ${getTranslation('节省')}: ${formatFileSize(result.saved)} (${compressionRatio}%)` : ` | ${getTranslation('变化')}: +${formatFileSize(result.compressedSize - result.originalSize)} (${Math.abs(compressionRatio)}%)`}</div>
            </div>
            <div class="result-actions">
                <button onclick="downloadFile('${result.url}', '${result.compressedName}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    ${getTranslation('下载')}
                </button>
            </div>
        `;
        
        resultsList.appendChild(resultItem);
        
        // 存储已渲染的结果项，用于后续更新
        renderedResults.push({ data: result, element: resultItem });
    }

    // 更新文件列表
    function updateFileList() {
        fileList.innerHTML = '';
        selectedFiles.forEach(file => renderFileItem(file));
    }

    // 清空文件列表
    function clearFileList() {
        selectedFiles = [];
        fileList.innerHTML = '';
        resultsList.innerHTML = '';
        renderedResults = [];
        resultsContainer.style.display = 'none';
        
        // 重置文件输入元素，允许重新上传相同文件
        fileInput.value = '';
    }

    // 显示提示消息
    function showToast(description, variant = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${variant === 'error' ? 'toast-error' : ''}`;
        
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
    
    // 获取翻译文本
    function getTranslation(key) {
        // 检查是否存在语言切换功能
        if (typeof LanguageSwitch !== 'undefined') {
            const currentLang = LanguageSwitch.getCurrentLanguage();
            if (currentLang !== 'zh') {
                const translations = {
                    // 界面文本
                    '点击选择图像文件或拖拽到此处': 'Click to Select Image Files or Drag Here',
                    '支持 PNG, JPG, JPEG, WebP, GIF, BMP 格式': 'Supports PNG, JPG, JPEG, WebP, GIF, BMP Formats',
                    '开始压缩': 'Start Compression',
                    '清空列表': 'Clear List',
                    '下载': 'Download',
                    '压缩结果': 'Compression Results',
                    '压缩质量': 'Compression Quality',
                    '尺寸调整': 'Size Adjustment',
                    '自动': 'Auto',
                    '输出格式': 'Output Format',
                    // 文件信息
                    '原始大小': 'Original Size',
                    '压缩后': 'Compressed',
                    '节省': 'Saved',
                    '变化': 'Change',
                    // 单位
                    '75%': '75%',
                    '50%': '50%',
                    '25%': '25%',
                    '1920px': '1920px',
                    '1280px': '1280px',
                    // 格式
                    'PNG': 'PNG',
                    'JPG': 'JPG',
                    'WebP': 'WebP',
                    'GIF': 'GIF',
                    'BMP': 'BMP',
                    // 提示文本
                    '错误': 'Error',
                    '成功': 'Success',
                    '提示': 'Info',
                    '警告': 'Warning',
                    '请上传至少一个文件': 'Please upload at least one file',
                    '压缩完成': 'Compression completed',
                    '处理失败': 'Processing failed'
                };
                return translations[key] || key;
            }
        }
        return key;
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 重新渲染结果项以应用翻译
    function rerenderResults() {
        // 保存当前滚动位置
        const scrollTop = resultsList.scrollTop;
        
        // 重新渲染每个结果项
        renderedResults.forEach(renderedResult => {
            const { data, element } = renderedResult;
            
            // 计算压缩率和状态
            const compressionRatio = ((data.originalSize - data.compressedSize) / data.originalSize * 100).toFixed(1);
            const isCompressed = data.effectiveCompression;
            
            // 查找现有的子元素
            const svgIcon = element.querySelector('.result-icon');
            const resultInfo = element.querySelector('.result-info');
            const resultName = resultInfo.querySelector('.result-name');
            const resultDetails = resultInfo.querySelector('.result-details');
            
            // 更新图标状态类
            svgIcon.className = `result-icon ${isCompressed ? 'success' : 'warning'}`;
            
            // 截断文件名并设置title属性
            const originalDisplay = truncateFileName(data.originalName, 30);
            const compressedDisplay = truncateFileName(data.compressedName, 30);
            const fullName = `${data.originalName} → ${data.compressedName}`;
            const displayName = `${originalDisplay} → ${compressedDisplay}`;
            
            resultName.textContent = displayName;
            resultName.title = fullName; // 添加完整文件名到title属性
            
            // 创建详情文本
            let detailsText = `${getTranslation('原始大小')}: ${formatFileSize(data.originalSize)} | ${getTranslation('压缩后')}: ${formatFileSize(data.compressedSize)}`;
            if (isCompressed) {
                detailsText += ` | ${getTranslation('节省')}: ${formatFileSize(data.saved)} (${compressionRatio}%)`;
            } else {
                detailsText += ` | ${getTranslation('变化')}: +${formatFileSize(data.compressedSize - data.originalSize)} (${Math.abs(compressionRatio)}%)`;
            }
            
            // 截断详情文本并设置title属性
            const maxDetailsLength = 100;
            const displayDetails = detailsText.length > maxDetailsLength ? detailsText.substring(0, maxDetailsLength - 3) + '...' : detailsText;
            
            resultDetails.textContent = displayDetails;
            resultDetails.title = detailsText; // 添加完整详情到title属性
        });
        
        // 恢复滚动位置
        resultsList.scrollTop = scrollTop;
    }
    
    // 初始化安全模块检查
    checkSecurityModules();
    
    // 初始化安全存储（如果可用）
    if (secureStorageLoaded) {
        // 尝试加载用户设置
        loadUserSettings();
    }
    
    // 异步加载用户设置
    async function loadUserSettings() {
        try {
            const settings = await SecureStorage.secureGetItem('compressionSettings', SecureStorage.STORAGE_TYPES.LOCAL);
            if (settings) {
                // 应用保存的设置
                if (settings.quality !== undefined) {
                    qualitySlider.value = settings.quality;
                    qualityValue.textContent = settings.quality;
                    updateSliderBackground(qualitySlider);
                }
                
                if (settings.sizeMode !== undefined) {
                    sizeSlider.value = settings.sizeMode;
                    sizeValue.textContent = getSizeLabel(settings.sizeMode);
                    updateSliderBackground(sizeSlider);
                }
                
                if (settings.format !== undefined) {
                    // 更新格式选择
                    formatOptions.forEach(option => {
                        option.classList.remove('active');
                        if (option.getAttribute('data-format') === settings.format) {
                            option.classList.add('active');
                        }
                    });
                }
            }
        } catch (error) {
            console.warn('加载用户设置失败:', error);
        }
    }
    
    // 保存用户设置
    async function saveUserSettings() {
        if (!secureStorageLoaded) return;
        
        try {
            const settings = {
                quality: parseInt(qualitySlider.value),
                sizeMode: parseInt(sizeSlider.value),
                format: document.querySelector('.format-option.active').getAttribute('data-format')
            };
            
            await SecureStorage.secureSetItem('compressionSettings', settings, SecureStorage.STORAGE_TYPES.LOCAL);
        } catch (error) {
            console.warn('保存用户设置失败:', error);
        }
    }
    
    // 获取尺寸标签
    function getSizeLabel(sizeMode) {
        const labels = ['自动', '75%', '50%', '25%', '1920px', '1280px'];
        return labels[sizeMode] || '自动';
    }
    
    // 在设置变化时保存
    qualitySlider.addEventListener('change', saveUserSettings);
    sizeSlider.addEventListener('change', saveUserSettings);
    formatOptions.forEach(option => {
        option.addEventListener('click', () => {
            setTimeout(saveUserSettings, 100); // 延迟保存，确保格式已更新
        });
    });
    
    // 添加使用并发控制的图像压缩函数
    async function compressImagesWithConcurrencyControl() {
        if (selectedFiles.length === 0) {
            showToast('请先选择要压缩的图像文件', 'error');
            return;
        }

        // 显示结果容器
        resultsContainer.style.display = 'block';
        resultsList.innerHTML = '';

        // 禁用压缩按钮
        compressBtn.disabled = true;
        compressBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            压缩中...
        `;

        try {
            // 检查并发控制器是否可用
            if (typeof ConcurrencyController !== 'undefined' && typeof getConcurrencyController === 'function') {
                // 使用并发控制器进行并发处理
                const controller = getConcurrencyController();
                
                // 创建任务数组
                const tasks = selectedFiles.map(file => ({
                    function: () => processImageAsync(file),
                    options: {
                        priority: TaskPriority.NORMAL,
                        metadata: { fileName: file.name }
                    }
                }));
                
                // 添加所有任务到控制器
                const promises = tasks.map(task => 
                    controller.addTask(task.function, task.options)
                );
                
                // 等待所有任务完成
                await Promise.all(promises);
            } else {
                // 降级到原始并发处理方法
                console.warn('并发控制器不可用，使用降级方案');
                const batchSize = 3;
                for (let i = 0; i < selectedFiles.length; i += batchSize) {
                    const batch = selectedFiles.slice(i, i + batchSize);
                    await Promise.all(batch.map(file => processImageAsync(file)));
                }
            }
        } catch (error) {
            console.error('压缩过程中出现错误:', error);
            showToast('压缩过程中出现错误: ' + error.message, 'error');
        } finally {
            // 重新启用压缩按钮
            compressBtn.disabled = false;
            compressBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                ${getTranslation('开始压缩')}
            `;
            
            // 保存用户设置
            saveUserSettings();
        }
    }
});

// 下载文件函数
function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // 显示下载成功的提示
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
            <div class="toast-title">成功</div>
            <div class="toast-description">文件 "${filename}" 下载成功</div>
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
}