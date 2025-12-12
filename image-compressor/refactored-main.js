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

    // 状态变量
    let selectedFiles = [];
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
            });
        });

        // 压缩按钮事件
        compressBtn.addEventListener('click', compressImages);

        // 清空按钮事件
        clearBtn.addEventListener('click', clearFileList);
    }

    // 处理文件选择
    function handleFileSelect(event) {
        const files = Array.from(event.target.files);
        addFilesToList(files);
    }

    // 处理拖拽事件
    function handleDragOver(event) {
        event.preventDefault();
        uploadArea.style.borderColor = '#3b82f6';
        uploadArea.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    }

    function handleDrop(event) {
        event.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.backgroundColor = '';
        
        const files = Array.from(event.dataTransfer.files);
        addFilesToList(files);
    }

    // 添加文件到列表
    function addFilesToList(files) {
        files.forEach(file => {
            // 检查文件类型
            if (!file.type.match('image.*')) {
                alert(`文件 ${file.name} 不是有效的图像文件`);
                return;
            }

            // 检查是否为支持的格式
            const supportedFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            if (!supportedFormats.includes(fileExtension)) {
                alert(`文件 ${file.name} 不是支持的图像格式，请使用 PNG, JPG, JPEG, WebP, GIF 或 BMP 格式`);
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
        fileItem.innerHTML = `
            <svg class="file-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button class="remove-file">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;

        // 添加删除事件
        const removeBtn = fileItem.querySelector('.remove-file');
        removeBtn.addEventListener('click', () => {
            selectedFiles = selectedFiles.filter(f => f !== file);
            fileItem.remove();
        });

        fileList.appendChild(fileItem);
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

    // 压缩图像
    function compressImages() {
        if (selectedFiles.length === 0) {
            alert('请先选择要压缩的图像文件');
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

        // 处理每个文件
        let completedCount = 0;
        
        selectedFiles.forEach((file, index) => {
            processImage(file, () => {
                completedCount++;
                if (completedCount === selectedFiles.length) {
                    // 重新启用压缩按钮
                    compressBtn.disabled = false;
                    compressBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        开始压缩
                    `;
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
                    // 创建canvas进行压缩
                    const canvas = document.createElement('canvas');
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
                        
                        // 如果智能压缩后文件仍然变大，使用原始文件
                        if (needsSmartCompression && blob.size >= file.size) {
                            createDirectResult(file, onComplete);
                            return;
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
                            url: URL.createObjectURL(blob)
                        };
                        
                        // 渲染结果
                        renderResult(result);
                        
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
        const result = {
            originalName: file.name,
            compressedName: file.name, // 保持原文件名
            originalSize: file.size,
            compressedSize: file.size,
            saved: 0,
            effectiveCompression: false,
            directCopy: true, // 标记为直接复制
            blob: file,
            url: URL.createObjectURL(file)
        };
        
        renderResult(result);
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
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                // 创建canvas进行压缩
                const canvas = document.createElement('canvas');
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
                        url: URL.createObjectURL(blob)
                    };
                    
                    // 渲染结果
                    renderResult(result);
                    
                    // 调用完成回调
                    onComplete();
                }, mimeType, quality);
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    // 渲染压缩结果
    function renderResult(result) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = result.url || '#';
        downloadLink.download = result.compressedName;
        downloadLink.className = 'download-link';
        downloadLink.textContent = '下载';
        
        // 如果有blob数据，设置下载链接
        if (result.blob) {
            downloadLink.href = result.url;
        } else {
            downloadLink.addEventListener('click', (e) => {
                e.preventDefault();
                alert('压缩结果不可用');
            });
        }
        
        // 计算压缩率和状态
        const compressionRatio = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1);
        const isCompressed = result.effectiveCompression;
        
        resultItem.innerHTML = `
            <svg class="result-icon ${isCompressed ? 'success' : 'warning'}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                ${isCompressed 
                    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
                    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />'
                }
            </svg>
            <div class="result-info">
                <div class="result-name">${result.originalName} → ${result.compressedName}</div>
                <div class="result-details">
                    原始大小: ${formatFileSize(result.originalSize)} | 
                    压缩后: ${formatFileSize(result.compressedSize)} | 
                    ${isCompressed 
                        ? `节省: ${formatFileSize(result.saved)} (${compressionRatio}%)`
                        : `变化: +${formatFileSize(result.compressedSize - result.originalSize)} (${Math.abs(compressionRatio)}%)`
                    }
                </div>
            </div>
        `;
        
        // 添加下载链接
        resultItem.appendChild(downloadLink);

        resultsList.appendChild(resultItem);
    }

    // 清空文件列表
    function clearFileList() {
        selectedFiles = [];
        fileList.innerHTML = '';
        resultsContainer.style.display = 'none';
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});