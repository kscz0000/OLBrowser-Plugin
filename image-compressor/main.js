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
    const selectAllCheckbox = document.getElementById('selectAll');
    const batchDownloadBtn = document.getElementById('batchDownloadBtn');
    const downloadProgress = document.getElementById('downloadProgress');
    const progressText = document.getElementById('progressText');
    const fileCounter = document.getElementById('fileCounter');
    const progressBar = document.getElementById('progressBar');

    // 状态变量
    let selectedFiles = [];
    let selectedFormat = 'png';
    let compressionQuality = 80;
    let sizeMode = 0; // 0=自动, 1=75%, 2=50%, 3=25%, 4=1920px, 5=1280px
    let compressedResults = []; // 存储压缩结果对象
    let selectedResults = new Set(); // 存储选中的结果索引

    // 获取翻译文本
    function getTranslation(key, variant = '') {
        // 使用共享的翻译系统
        if (typeof LanguageSwitch !== 'undefined' && LanguageSwitch.getTranslation) {
            const translated = LanguageSwitch.getTranslation(key);
            
            // 如果是复杂键（包含参数），需要处理替换
            if (typeof key === 'string' && key.includes('{')) {
                let finalTranslated = translated;
                // 处理参数替换
                if (key.includes('{name}') && variant.name) {
                    finalTranslated = finalTranslated.replace('{name}', variant.name);
                }
                if (key.includes('{filename}') && variant.filename) {
                    finalTranslated = finalTranslated.replace('{filename}', variant.filename);
                }
                if (key.includes('{error}') && variant.error) {
                    finalTranslated = finalTranslated.replace('{error}', variant.error);
                }
                return finalTranslated;
            }
            
            // 处理toastTitle的特殊情况
            if (key === 'toastTitle') {
                // toast类型不需要翻译
                return variant;
            }
            
            return translated;
        }
        return key;
    }

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
    }

    // 初始化函数
    function setupEventListeners() {
        // 上传区域点击事件
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择事件
        fileInput.addEventListener('change', handleFileSelect);

        // 拖拽事件
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);

        // 压缩质量滑块事件
        qualitySlider.addEventListener('input', updateQualityValue);
        
        // 尺寸滑块事件
        sizeSlider.addEventListener('input', updateSizeMode);
        
        // 尺寸预设按钮事件
        sizePresets.forEach(preset => {
            preset.addEventListener('click', () => {
                // 移除所有预设按钮的激活状态
                sizePresets.forEach(p => p.classList.remove('active'));
                // 激活当前按钮
                preset.classList.add('active');
                // 更新滑块值
                sizeSlider.value = preset.dataset.size;
                // 更新尺寸模式
                sizeMode = parseInt(preset.dataset.size);
                // 更新显示
                updateSizeMode();
            });
        });

        // 格式选择事件
        formatOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 移除所有选项的激活状态
                formatOptions.forEach(opt => opt.classList.remove('active'));
                // 激活当前选项
                option.classList.add('active');
                // 更新选中格式
                selectedFormat = option.dataset.format;
                
                // 对于PNG格式添加提示
                if (selectedFormat === 'png') {
                    showToast('PNG为无损压缩格式，通常压缩后文件可能不会变小，建议仅在需要调整尺寸时使用', 'info');
                }
            });
        });

        // 压缩按钮事件
        compressBtn.addEventListener('click', function() {
            createRippleEffect(compressBtn);
            compressImages();
        });

        // 清空按钮事件
        clearBtn.addEventListener('click', function() {
            createRippleEffect(clearBtn);
            clearFileList();
        });
        
        // 保存设置事件
        qualitySlider.addEventListener('change', saveUserSettings);
        sizeSlider.addEventListener('change', saveUserSettings);
        formatOptions.forEach(option => {
            option.addEventListener('click', saveUserSettings);
        });
        
        // 全选/取消全选事件
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const isChecked = this.checked;
                const checkboxes = document.querySelectorAll('.result-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = isChecked;
                    const index = parseInt(checkbox.dataset.index);
                    if (isChecked) {
                        selectedResults.add(index);
                    } else {
                        selectedResults.delete(index);
                    }
                });
                updateBatchDownloadButton();
            });
        }
        
        // 批量下载按钮事件
        if (batchDownloadBtn) {
            batchDownloadBtn.addEventListener('click', function() {
                createRippleEffect(batchDownloadBtn);
                batchDownload();
            });
        }
    }

    // 处理文件选择
    function handleFileSelect(event) {
        const files = Array.from(event.target.files);
        addFilesToList(files);
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

    function handleDrop(event) {
        event.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files);
        addFilesToList(files);
    }

    // 添加文件到列表
    async function addFilesToList(files) {
        for (const file of files) {
            // 使用文件验证器进行深度验证
            const validation = FileValidator.validateFile(file);
            
            if (!validation.isValid) {
                // 显示验证错误
                const errorMsg = validation.errors.join(', ');
                showToast(`文件 ${file.name} 验证失败: ${errorMsg}`, 'error');
                continue;
            }
            
            // 显示验证警告（如果有）
            if (validation.warnings.length > 0) {
                const warningMsg = validation.warnings.join(', ');
                showToast(`文件 ${file.name} 警告: ${warningMsg}`, 'warning');
            }
            
            // 检查是否已存在
            if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                selectedFiles.push(file);
                renderFileItem(file);
            }
        }
    }

    // 渲染文件项
    function renderFileItem(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon-cell">
                <svg class="file-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <div class="file-name-cell">
                <span class="file-name" title="${file.name}">${truncateFileName(file.name, 40)}</span>
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
            const index = selectedFiles.indexOf(file);
            if (index > -1) {
                // 释放对应的压缩结果资源
                if (compressedResults[index] && compressedResults[index].resourceId) {
                    releaseResource(compressedResults[index].resourceId);
                    compressedResults[index].url = null;
                }
                
                // 从数组中移除文件
                selectedFiles.splice(index, 1);
                compressedResults.splice(index, 1);
                
                // 移除UI元素
                fileItem.remove();
            }
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
    }

    // 创建涟漪效果
    function createRippleEffect(element) {
        element.classList.add('ripple');

        setTimeout(() => {
            element.classList.remove('ripple');
        }, 600);
    }

    // 显示提示消息
    function showToast(description, variant = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${variant === 'error' ? 'toast-error' : ''}`;

        // 获取翻译文本
        const titleText = getTranslation('toastTitle', variant);
        
        toast.innerHTML = `
            <div class="toast-title">${titleText}</div>
            <div class="toast-description">${getTranslation(description, variant)}</div>
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

    // 压缩图像
    function compressImages() {
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
            ${getTranslation('压缩中...')}
        `;

        // 处理每个文件
        let completedCount = 0;
        const totalFiles = selectedFiles.length;
        
        selectedFiles.forEach((file, index) => {
            processImage(file, () => {
                completedCount++;
                if (completedCount === totalFiles) {
                    // 重新启用压缩按钮
                    compressBtn.disabled = false;
                    compressBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        ${getTranslation('开始压缩')}
                    `;
                    
                    showToast('压缩完成', 'success');
                    saveUserSettings();
                }
            });
        });
    }

    // 优化的图像处理函数
    function processImage(file, onComplete) {
        // 获取原始文件格式
        const originalFormat = file.name.split('.').pop().toLowerCase();
        
        // 检查是否需要智能压缩（避免同格式无损压缩导致文件变大）
        const needsSmartCompression = shouldApplySmartCompression(originalFormat, selectedFormat, compressionQuality);
        
        // 使用createImageBitmap创建图像位图，更节省内存
        createImageBitmap(file)
            .then(bitmap => {
                try {
                    // 使用资源管理器创建托管canvas
                    const { canvas, resourceId: canvasResourceId } = createManagedCanvas(0, 0, {
                        operation: 'image-compression',
                        fileName: file.name
                    });
                    
                    const ctx = canvas.getContext('2d');
                    
                    // 计算优化的尺寸
                    const { width, height } = calculateOptimizedDimensions(bitmap.width, bitmap.height, compressionQuality, sizeMode);
                    
                    // 设置canvas尺寸
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 使用优化的绘制方法
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = compressionQuality > 70 ? 'high' : 'medium';
                    
                    // 绘制图像到canvas
                    ctx.drawImage(bitmap, 0, 0, width, height);
                    
                    // 应用额外的压缩技术
                    if (selectedFormat === 'jpeg' || selectedFormat === 'webp') {
                        applyAdvancedCompression(ctx, width, height, compressionQuality);
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
                    canvas.toBlob(function(blob) {
                        // 释放内存
                        bitmap.close();
                        releaseResource(canvasResourceId);
                        
                        // 如果智能压缩后文件仍然变大，使用原始文件
                        if (needsSmartCompression && blob.size >= file.size) {
                            createDirectResult(file, onComplete);
                            return;
                        }
                        
                        // 创建压缩后的结果对象
                        const saved = file.size - blob.size;
                        
                        // 使用资源管理器创建托管URL
                        const { url, resourceId } = createManagedBlobUrl(blob, {
                            originalName: file.name,
                            compressedName: file.name.replace(/\.[^/.]+$/, `.${selectedFormat}`),
                            originalSize: file.size,
                            compressedSize: blob.size
                        });
                        
                        const result = {
                            originalName: file.name,
                            compressedName: file.name.replace(/\.[^/.]+$/, `.${selectedFormat}`),
                            originalSize: file.size,
                            compressedSize: blob.size,
                            saved: saved,
                            effectiveCompression: saved > 0,
                            blob: blob,
                            url: url,
                            resourceId: resourceId
                        };
                        
                        // 保存结果到数组
                        compressedResults.push(result);
                        
                        // 渲染结果
                        renderResult(result, compressedResults.length - 1);
                        
                        // 调用完成回调
                        onComplete();
                    }, mimeType, quality);
                } catch (error) {
                    console.error('Error processing image:', error);
                    bitmap.close();
                    onComplete();
                }
            })
            .catch(error => {
                console.error('Error loading image:', error);
                // 回退到FileReader方法
                fallbackImageProcessing(file, onComplete);
            });
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

    // 创建直接使用原始文件的结果
    function createDirectResult(file, onComplete) {
        // 使用资源管理器创建托管URL
        const { url, resourceId } = createManagedBlobUrl(file, {
            originalName: file.name,
            originalSize: file.size
        });
        
        const result = {
            originalName: file.name,
            compressedName: file.name, // 保持原文件名
            originalSize: file.size,
            compressedSize: file.size,
            saved: 0,
            effectiveCompression: false,
            directCopy: true, // 标记为直接复制
            blob: file,
            url: url,
            resourceId: resourceId
        };
        
        // 保存结果到数组
        compressedResults.push(result);
        
        renderResult(result, compressedResults.length - 1);
        onComplete();
    }

    // 计算优化的尺寸
    function calculateOptimizedDimensions(originalWidth, originalHeight, quality, sizeMode) {
        let scaleFactor = 1;
        
        // 根据尺寸模式计算缩放因子
        switch (sizeMode) {
            case 0: // 自动模式 - 根据质量自动调整
                if (quality >= 90) {
                    scaleFactor = 1; // 高质量不调整尺寸
                } else if (quality < 30) {
                    scaleFactor = 0.5; // 极低质量：缩小到50%
                } else if (quality < 50) {
                    scaleFactor = 0.7; // 低质量：缩小到70%
                } else if (quality < 70) {
                    scaleFactor = 0.85; // 中等质量：缩小到85%
                } else if (quality < 90) {
                    scaleFactor = 0.95; // 高质量：缩小到95%
                }
                break;
                
            case 1: // 75%
                scaleFactor = 0.75;
                break;
                
            case 2: // 50%
                scaleFactor = 0.5;
                break;
                
            case 3: // 25%
                scaleFactor = 0.25;
                break;
                
            case 4: // 1920px
                const maxDimension1920 = 1920;
                const currentMax1920 = Math.max(originalWidth, originalHeight);
                if (currentMax1920 > maxDimension1920) {
                    scaleFactor = maxDimension1920 / currentMax1920;
                }
                break;
                
            case 5: // 1280px
                const maxDimension1280 = 1280;
                const currentMax1280 = Math.max(originalWidth, originalHeight);
                if (currentMax1280 > maxDimension1280) {
                    scaleFactor = maxDimension1280 / currentMax1280;
                }
                break;
        }
        
        // 对非常大的图像进行额外保护性缩小
        const absoluteMaxDimension = 4096;
        const currentMaxDimension = Math.max(originalWidth, originalHeight);
        
        if (currentMaxDimension > absoluteMaxDimension) {
            scaleFactor = Math.min(scaleFactor, absoluteMaxDimension / currentMaxDimension);
        }
        
        // 确保最小尺寸
        const minDimension = 50;
        const minScaleFactor = Math.max(minDimension / originalWidth, minDimension / originalHeight);
        scaleFactor = Math.max(scaleFactor, minScaleFactor);
        
        return {
            width: Math.round(originalWidth * scaleFactor),
            height: Math.round(originalHeight * scaleFactor)
        };
    }

    // 应用高级压缩技术
    function applyAdvancedCompression(ctx, width, height, quality) {
        // 对低质量图像应用额外的模糊处理以减少文件大小
        if (quality < 50) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // 简单的降采样处理 - 减少颜色深度
            const colorReduction = Math.floor((100 - quality) / 10);
            
            for (let i = 0; i < data.length; i += 4) {
                // 降低颜色精度
                data[i] = Math.round(data[i] / colorReduction) * colorReduction;     // R
                data[i + 1] = Math.round(data[i + 1] / colorReduction) * colorReduction; // G
                data[i + 2] = Math.round(data[i + 2] / colorReduction) * colorReduction; // B
                // Alpha通道保持不变
            }
            
            ctx.putImageData(imageData, 0, 0);
        }
    }

    // 回退的图像处理方法
    function fallbackImageProcessing(file, onComplete) {
        // 使用资源管理器创建托管FileReader
        const { reader, resourceId: readerResourceId } = createManagedFileReader({
            operation: 'fallback-image-processing',
            fileName: file.name
        });
        
        reader.onload = function(e) {
            // 使用资源管理器创建托管Image
            const { img, resourceId: imgResourceId } = createManagedImage({
                operation: 'fallback-image-processing',
                fileName: file.name
            });
            
            img.onload = function() {
                // 使用资源管理器创建托管canvas
                const { canvas, resourceId: canvasResourceId } = createManagedCanvas(0, 0, {
                    operation: 'fallback-image-compression',
                    fileName: file.name
                });
                
                const ctx = canvas.getContext('2d');
                
                // 计算优化的尺寸
                const { width, height } = calculateOptimizedDimensions(img.width, img.height, compressionQuality, sizeMode);
                
                // 设置canvas尺寸
                canvas.width = width;
                canvas.height = height;
                
                // 绘制图像到canvas
                ctx.drawImage(img, 0, 0, width, height);
                
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
                
                // 将质量转换为0-1范围
                const quality = compressionQuality / 100;
                
                // 转换为blob
                canvas.toBlob(function(blob) {
                    // 释放所有资源
                    releaseResource(readerResourceId);
                    releaseResource(imgResourceId);
                    releaseResource(canvasResourceId);
                    
                    // 使用资源管理器创建托管URL
                    const { url, resourceId } = createManagedBlobUrl(blob, {
                        originalName: file.name,
                        compressedName: file.name.replace(/\.[^/.]+$/, `.${selectedFormat}`),
                        originalSize: file.size,
                        compressedSize: blob.size
                    });
                    
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
                        url: url,
                        resourceId: resourceId
                    };
                    
                    // 保存结果到数组
                    compressedResults.push(result);
                    
                    // 渲染结果
                    renderResult(result, compressedResults.length - 1);
                    
                    // 调用完成回调
                    onComplete();
                }, mimeType, quality);
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    // 渲染压缩结果
    function renderResult(result, index) {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${result.effectiveCompression ? '' : 'warning'}`;
        resultItem.dataset.index = index;
        
        // 计算压缩率
        const compressionRatio = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1);
        const isCompressed = result.effectiveCompression;
        
        resultItem.innerHTML = `
            <input type="checkbox" class="result-checkbox" data-index="${index}">
            <div class="result-icon ${isCompressed ? 'success' : 'warning'}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${isCompressed 
                        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />'
                        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />'
                    }
                </svg>
            </div>
            <div class="result-info">
                <div class="result-name" title="${result.originalName} → ${result.compressedName}">${truncateFileName(result.originalName, 20)} → ${truncateFileName(result.compressedName, 20)}</div>
                <div class="result-details">
                    ${getTranslation('原始大小')}: ${formatFileSize(result.originalSize)} | 
                    ${getTranslation('压缩后')}: ${formatFileSize(result.compressedSize)} | 
                    ${isCompressed 
                        ? `${getTranslation('节省')}: ${formatFileSize(result.saved)} (${compressionRatio}%)`
                        : result.saved === 0 && result.directCopy 
                            ? `${getTranslation('直接复制')}` 
                            : `${getTranslation('变化')}: +${formatFileSize(result.compressedSize - result.originalSize)} (${Math.abs(compressionRatio)}%)`
                    }
                </div>
            </div>
            <div class="result-actions">
                <button class="download-btn" data-url="${result.url}" data-filename="${result.compressedName}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>${getTranslation('下载')}</span>
                </button>
            </div>
        `;

        resultsList.appendChild(resultItem);
        
        // 添加下载按钮事件监听器
        const downloadBtn = resultItem.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                const filename = this.getAttribute('data-filename');
                downloadFile(url, filename);
            });
        }
        
        // 更新下载按钮文本（确保翻译应用）
        const downloadBtnSpan = downloadBtn.querySelector('span');
        if (downloadBtnSpan) {
            downloadBtnSpan.textContent = getTranslation('下载');
        }
        
        // 添加复选框事件监听器
        const checkbox = resultItem.querySelector('.result-checkbox');
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                selectedResults.add(index);
            } else {
                selectedResults.delete(index);
            }
            updateBatchDownloadButton();
            updateSelectAllCheckbox();
        });
    }

    // 下载文件函数
    window.downloadFile = function(url, filename) {
        try {
            // 检查是否支持fetch API
            if (typeof fetch !== 'undefined') {
                // 使用fetch API下载文件
                fetch(url)
                    .then(response => response.blob())
                    .then(blob => {
                        // 创建下载链接
                        const downloadUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        // 清理URL对象
                        setTimeout(() => {
                            URL.revokeObjectURL(downloadUrl);
                        }, 100);
                        
                        // 显示下载成功的提示
                        showToast(`文件 "${filename}" 下载成功`, 'success');
                    })
                    .catch(error => {
                        console.error('Fetch下载失败:', error);
                        throw error;
                    });
            } else {
                // 降级到传统方法
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // 显示下载成功的提示
                showToast(`文件 "${filename}" 下载成功`, 'success');
            }
        } catch (error) {
            console.error('下载失败:', error);
            showToast(`文件 "${filename}" 下载失败: ${error.message}`, 'error');
        }
    };

    // 释放压缩结果资源
    function releaseCompressedResult(resultIndex) {
        const result = compressedResults[resultIndex];
        if (result && result.resourceId) {
            releaseResource(result.resourceId);
            result.url = null;
        }
    }

    // 释放所有压缩结果资源
    function releaseAllCompressedResults() {
        compressedResults.forEach((result, index) => {
            if (result && result.resourceId) {
                releaseResource(result.resourceId);
                result.url = null;
            }
        });
    }

    // 清空文件列表
    function clearFileList() {
        // 释放所有压缩结果资源
        releaseAllCompressedResults();
        
        // 清空数组
        selectedFiles = [];
        compressedResults = [];
        selectedResults.clear();
        fileList.innerHTML = '';
        resultsList.innerHTML = '';
        resultsContainer.style.display = 'none';
        
        // 重置文件输入元素，允许重新上传相同文件
        fileInput.value = '';
        
        // 重置批量下载相关UI
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        if (batchDownloadBtn) {
            batchDownloadBtn.disabled = true;
        }
        if (downloadProgress) {
            downloadProgress.style.display = 'none';
        }
    }
    
    // 更新批量下载按钮状态
    function updateBatchDownloadButton() {
        if (batchDownloadBtn) {
            batchDownloadBtn.disabled = selectedResults.size === 0;
        }
    }
    
    // 更新全选复选框状态
    function updateSelectAllCheckbox() {
        if (selectAllCheckbox) {
            const allCheckboxes = document.querySelectorAll('.result-checkbox');
            const checkedCheckboxes = document.querySelectorAll('.result-checkbox:checked');
            selectAllCheckbox.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
        }
    }
    
    // 生成带有时间戳的文件名
    function generateTimestampedFilename(originalFilename) {
        const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
        const [nameWithoutExt, ext] = originalFilename.split(/\.(?=[^.]+$)/);
        return `${nameWithoutExt}_compressed_${timestamp}.${ext}`;
    }
    
    // 批量下载功能
    async function batchDownload() {
        if (selectedResults.size === 0) {
            showToast('请先选择要下载的文件', 'error');
            return;
        }
        
        // 显示下载进度
        if (downloadProgress) {
            downloadProgress.style.display = 'block';
        }
        
        const selectedIndices = Array.from(selectedResults);
        const totalFiles = selectedIndices.length;
        let completedFiles = 0;
        let successCount = 0;
        let failureCount = 0;
        let isCancelled = false;
        
        // 并发控制：限制同时下载的文件数量
        const CONCURRENCY_LIMIT = 3;
        let activeDownloads = 0;
        let downloadQueue = [...selectedIndices];
        
        // 用于存储所有下载的Promise
        const downloadPromises = [];
        
        // 用于节流进度更新
        let lastProgressUpdate = 0;
        const PROGRESS_THROTTLE_MS = 100;
        
        // 更新初始进度
        updateProgress(0, totalFiles, '准备开始下载...');
        
        // 批量下载取消功能
        function cancelBatchDownload() {
            isCancelled = true;
            updateProgress(completedFiles, totalFiles, '下载已取消');
            showToast(`批量下载已取消: 已完成 ${completedFiles}/${totalFiles} 个文件`, 'warning');
            
            // 5秒后隐藏进度条
            setTimeout(() => {
                if (downloadProgress) {
                    downloadProgress.style.display = 'none';
                }
            }, 5000);
        }
        
        // 执行单个下载任务
        async function executeDownload(index) {
            if (isCancelled) return;
            
            const result = compressedResults[index];
            if (!result) return;
            
            try {
                // 生成带有时间戳的文件名
                const timestampedFilename = generateTimestampedFilename(result.compressedName);
                
                // 使用优化的下载方法
                await downloadFileWithProgress(result.url, timestampedFilename, (progress) => {
                    // 节流更新进度，减少DOM操作
                    const now = Date.now();
                    if (now - lastProgressUpdate > PROGRESS_THROTTLE_MS) {
                        lastProgressUpdate = now;
                        // 计算总体进度
                        const overallProgress = ((completedFiles + progress) / totalFiles) * 100;
                        progressBar.style.width = `${overallProgress}%`;
                    }
                });
                
                successCount++;
                showToast(`文件 "${result.originalName}" 下载成功`, 'success');
            } catch (error) {
                if (!isCancelled) {
                    failureCount++;
                    console.error(`下载失败: ${result.originalName}`, error);
                    showToast(`文件 "${result.originalName}" 下载失败: ${error.message}`, 'error');
                }
            } finally {
                completedFiles++;
                activeDownloads--;
                
                // 更新总体进度（使用节流）
                const now = Date.now();
                if (now - lastProgressUpdate > PROGRESS_THROTTLE_MS) {
                    lastProgressUpdate = now;
                    updateProgress(completedFiles, totalFiles, `正在下载... (${completedFiles}/${totalFiles})`);
                }
                
                // 执行下一个下载任务
                if (downloadQueue.length > 0) {
                    const nextIndex = downloadQueue.shift();
                    activeDownloads++;
                    downloadPromises.push(executeDownload(nextIndex));
                }
            }
        }
        
        // 启动初始下载任务
        for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, downloadQueue.length); i++) {
            const index = downloadQueue.shift();
            activeDownloads++;
            downloadPromises.push(executeDownload(index));
        }
        
        // 等待所有下载完成
        await Promise.allSettled(downloadPromises);
        
        // 如果没有被取消，显示下载完成信息
        if (!isCancelled) {
            updateProgress(totalFiles, totalFiles, '下载完成');
            showToast(`批量下载完成: 成功 ${successCount} 个，失败 ${failureCount} 个`, 'success');
            
            // 5秒后隐藏进度条
            setTimeout(() => {
                if (downloadProgress) {
                    downloadProgress.style.display = 'none';
                }
            }, 5000);
        }
    }
    
    // 更新进度显示
    function updateProgress(completed, total, message) {
        if (progressText) {
            progressText.textContent = message;
        }
        if (fileCounter) {
            fileCounter.textContent = `${completed}/${total}`;
        }
        if (progressBar) {
            const progress = (completed / total) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }
    
    // 优化的下载文件函数，支持进度跟踪
    async function downloadFileWithProgress(url, filename, onProgress) {
        return new Promise((resolve, reject) => {
            try {
                // 检查是否支持fetch API
                if (typeof fetch !== 'undefined') {
                    // 使用fetch API下载文件
                    fetch(url)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            
                            const contentLength = parseInt(response.headers.get('Content-Length') || '0');
                            let receivedLength = 0;
                            const chunks = [];
                            
                            const reader = response.body.getReader();
                            
                            // 使用异步迭代器替代递归，避免栈溢出
                            async function readAllChunks() {
                                let done = false;
                                while (!done) {
                                    try {
                                        const result = await reader.read();
                                        done = result.done;
                                        if (result.value) {
                                            chunks.push(result.value);
                                            receivedLength += result.value.length;
                                            if (contentLength > 0 && onProgress) {
                                                onProgress(receivedLength / contentLength);
                                            }
                                        }
                                    } catch (error) {
                                        console.error('读取文件块失败:', error);
                                        throw error;
                                    }
                                }
                            }
                            
                            return readAllChunks()
                                .then(() => {
                                    // 优化：使用typed array预分配内存，提高大文件处理速度
                                    let blob;
                                    if (contentLength > 0) {
                                        // 如果知道内容长度，使用TypedArray提高性能
                                        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                                        const result = new Uint8Array(totalLength);
                                        let offset = 0;
                                        for (const chunk of chunks) {
                                            result.set(new Uint8Array(chunk), offset);
                                            offset += chunk.length;
                                        }
                                        blob = new Blob([result], { type: response.headers.get('Content-Type') || '' });
                                    } else {
                                        // 否则使用原始chunks数组
                                        blob = new Blob(chunks, { type: response.headers.get('Content-Type') || '' });
                                    }
                                    downloadBlob(blob, filename);
                                    resolve();
                                });
                        })
                        .catch(error => {
                            console.error('Fetch下载失败:', error);
                            reject(error);
                        });
                } else {
                    // 降级到传统方法
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // 清理URL对象
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                    }, 100);
                    
                    resolve();
                }
            } catch (error) {
                console.error('下载失败:', error);
                reject(error);
            }
        });
    }
    
    // 下载Blob对象
    function downloadBlob(blob, filename) {
        try {
            // 检查是否支持createObjectURL
            if (typeof URL !== 'undefined' && URL.createObjectURL) {
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                
                // 优化：设置noopener和noreferrer增强安全性
                a.rel = 'noopener noreferrer';
                a.href = downloadUrl;
                a.download = filename;
                
                // 优化：对于大文件，使用dispatchEvent触发点击事件
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                // 优化：不需要将元素添加到DOM中，直接触发事件
                a.dispatchEvent(clickEvent);
                
                // 优化：使用requestIdleCallback在浏览器空闲时清理URL，避免阻塞主线程
                if (typeof requestIdleCallback !== 'undefined') {
                    requestIdleCallback(() => {
                        URL.revokeObjectURL(downloadUrl);
                    }, { timeout: 1000 });
                } else {
                    // 降级方案
                    setTimeout(() => {
                        URL.revokeObjectURL(downloadUrl);
                    }, 1000);
                }
            } else {
                // 降级方案：使用传统的window.open
                const reader = new FileReader();
                reader.onloadend = function() {
                    const dataUrl = reader.result;
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };
                reader.readAsDataURL(blob);
            }
        } catch (error) {
            console.error('下载Blob失败:', error);
            // 降级到alert提示用户手动下载
            showToast('下载失败，请尝试手动保存文件', 'error');
        }
    }

    // 保存用户设置
    async function saveUserSettings() {
        if (typeof SecureStorage !== 'undefined') {
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
    }

    // 加载用户设置
    async function loadUserSettings() {
        if (typeof SecureStorage !== 'undefined') {
            try {
                const settings = await SecureStorage.secureGetItem('compressionSettings', SecureStorage.STORAGE_TYPES.LOCAL);
                if (settings) {
                    // 应用保存的设置
                    if (settings.quality !== undefined) {
                        qualitySlider.value = settings.quality;
                        qualityValue.textContent = settings.quality;
                    }

                    if (settings.sizeMode !== undefined) {
                        sizeSlider.value = settings.sizeMode;
                        sizeValue.textContent = getSizeLabel(settings.sizeMode);
                        updateSizeMode();
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
                // 如果加载设置失败，重置为默认值
                console.log('正在重置为默认设置...');
                resetToDefaultSettings();
            }
        }
    }
    
    // 获取尺寸标签
    function getSizeLabel(sizeMode) {
        const labels = [
            getTranslation('自动'), 
            '75%', 
            '50%', 
            '25%', 
            '1920px', 
            '1280px'
        ];
        return labels[sizeMode] || getTranslation('自动');
    }
    
    // 重置为默认设置
    function resetToDefaultSettings() {
        // 重置压缩质量
        compressionQuality = 80;
        qualitySlider.value = compressionQuality;
        qualityValue.textContent = `${compressionQuality}%`;
        
        // 重置尺寸模式
        sizeMode = 0;
        sizeSlider.value = sizeMode;
        sizeValue.textContent = getSizeLabel(sizeMode);
        updateSizeMode();
        
        // 重置格式选择
        formatOptions.forEach(option => option.classList.remove('active'));
        // 默认选择PNG格式
        const pngOption = document.querySelector('.format-option[data-format="png"]');
        if (pngOption) {
            pngOption.classList.add('active');
            selectedFormat = 'png';
        }
        
        // 更新尺寸预设按钮
        sizePresets.forEach(p => p.classList.remove('active'));
        if (sizePresets.length > 0) {
            sizePresets[0].classList.add('active');
        }
        
        console.log('已重置为默认设置');
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 更新所有带有data-i18n属性的元素的文本
    function updateUITexts() {
        // 更新带有data-i18n属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            // 对于button等元素，我们不应该直接替换textContent，而应该保留内部的HTML结构
            if (element.tagName === 'BUTTON') {
                // 对于按钮，只更新文本节点
                for (let i = 0; i < element.childNodes.length; i++) {
                    const childNode = element.childNodes[i];
                    if (childNode.nodeType === Node.TEXT_NODE) {
                        const text = childNode.textContent.trim();
                        if (text) {
                            childNode.textContent = getTranslation(text);
                        }
                    } else if (childNode.tagName === 'SPAN' && childNode.hasAttribute('data-i18n-text')) {
                        const key = childNode.getAttribute('data-i18n-text');
                        childNode.textContent = getTranslation(key);
                    }
                }
            } else {
                // 对于其他元素，直接替换textContent
                element.textContent = getTranslation(key);
            }
        });
        
        // 更新嵌套的翻译文本
        const textElements = document.querySelectorAll('[data-i18n-text]');
        textElements.forEach(element => {
            const key = element.getAttribute('data-i18n-text');
            element.textContent = getTranslation(key);
        });
        
        // 更新尺寸预设按钮的文本
        const sizePresets = document.querySelectorAll('.size-preset');
        sizePresets.forEach(preset => {
            const key = preset.getAttribute('data-i18n');
            if (key) {
                preset.textContent = getTranslation(key);
            }
        });
    }
    
    // 初始化应用
    function initializeApp() {
        loadUserSettings();
        updateUITexts();
    }
    
    // 初始化应用
    initializeApp();
    
    // 监听语言切换事件
    window.addEventListener('languageChanged', function() {
        updateUITexts();
        // 更新所有下载按钮文本
        const downloadButtons = document.querySelectorAll('.download-btn span');
        downloadButtons.forEach(span => {
            span.textContent = getTranslation('下载');
        });
        
        // 更新压缩结果显示中的文本
        const resultDetails = document.querySelectorAll('.result-details');
        resultDetails.forEach(detail => {
            const text = detail.textContent;
            if (text.includes('原始大小:') || text.includes('Original Size:')) {
                detail.textContent = text
                    .replace(/原始大小:/g, getTranslation('原始大小'))
                    .replace(/Original Size:/g, getTranslation('原始大小'))
                    .replace(/压缩后:/g, getTranslation('压缩后'))
                    .replace(/Compressed:/g, getTranslation('压缩后'))
                    .replace(/节省:/g, getTranslation('节省'))
                    .replace(/Saved:/g, getTranslation('节省'))
                    .replace(/变化:/g, getTranslation('变化'))
                    .replace(/Change:/g, getTranslation('变化'))
                    .replace(/直接复制/g, getTranslation('直接复制'));
            }
        });
    });
});