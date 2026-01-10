/**
 * PPTX 处理模块
 * 用于处理 .pptx 文件，提取并压缩其中的图片资源
 * 创建时间：2025-12-15
 */

/**
 * 计算图片内容的SHA-256哈希值
 * @param {Blob} blob - 图片blob对象
 * @returns {Promise<string>} 十六进制哈希字符串
 */
async function calculateImageHash(blob) {
    try {
        const arrayBuffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

        // 立即转换为字符串，让arrayBuffer可以被GC快速回收
        const hashHex = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return hashHex;
    } catch (error) {
        console.error('计算图片哈希失败:', error);
        throw new Error(`计算图片哈希失败: ${error.message}`);
    }
}

/**
 * 从 PPTX 文件中提取图片
 * @param {File} pptxFile - PPTX 文件对象
 * @returns {Promise<Object>} { images: Array<{name: string, blob: Blob, path: string}>, zip: JSZip }
 */
async function extractImagesFromPptx(pptxFile) {
    try {
        // 检查 JSZip 是否可用
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip 库未加载，请检查网络连接');
        }

        // 加载 PPTX 文件
        const zip = await JSZip.loadAsync(pptxFile);
        const images = [];
        const allFiles = [];

        // 遍历 ZIP 中的所有文件
        const imagePromises = [];
        zip.forEach(function(relativePath, zipEntry) {
            // 记录所有文件路径用于调试
            allFiles.push(relativePath);
            
            // 检查是否是图片文件
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
            const isImage = imageExtensions.some(ext => relativePath.toLowerCase().endsWith(ext));

            // 排除目录和XML文件
            if (isImage && !zipEntry.dir && !relativePath.toLowerCase().endsWith('.xml')) {
                // 读取图片数据并添加到 promises 数组
                const promise = zipEntry.async('blob').then(function(blob) {
                    images.push({
                        name: relativePath,
                        blob: blob,
                        path: relativePath,
                        size: blob.size
                    });
                });
                imagePromises.push(promise);
            }
        });

        // 等待所有图片提取完成
        await Promise.all(imagePromises);

        // 过滤小图片和不需要的图片
        const MIN_IMAGE_SIZE = 1 * 1024; // 降低到1KB，避免误过滤正常图片

        // 应用路径过滤规则
        const pathFilteredImages = images.filter(img => shouldIncludeImage(img.path));

        // 应用大小过滤
        const filteredImages = pathFilteredImages.filter(img => img.size >= MIN_IMAGE_SIZE);

        console.log('PPTX 文件中的所有文件数量:', allFiles.length);
        console.log('提取的图片数量:', images.length);
        console.log('路径过滤后的图片数量:', pathFilteredImages.length);
        console.log('最终过滤后的图片数量:', filteredImages.length);
        console.log('路径过滤掉的图片:', images.filter(img => !shouldIncludeImage(img.path)).map(img => img.path));
        console.log('大小过滤掉的图片:', pathFilteredImages.filter(img => img.size < MIN_IMAGE_SIZE).map(img => `${img.name} (${img.size} bytes)`));

        return {
            images: filteredImages,
            zip: zip
        };
    } catch (error) {
        console.error('提取 PPTX 图片失败:', error);
        throw new Error(`提取 PPTX 图片失败: ${error.message}`);
    }
}

/**
 * 判断是否应该包含该图片
 * @param {string} imagePath - 图片路径
 * @returns {boolean} 是否包含
 */
function shouldIncludeImage(imagePath) {
    const path = imagePath.toLowerCase();

    // 只包含media/或ppt/media/文件夹中的图片
    if (!path.startsWith('media/') && !path.startsWith('ppt/media/')) {
        return false;
    }

    // 排除缩略图
    if (path.includes('thumb') || path.includes('thumbnail')) {
        return false;
    }

    // 排除关系文件
    if (path.includes('_rels/')) {
        return false;
    }

    // 排除主题文件
    if (path.includes('theme')) {
        return false;
    }

    // 排除模板文件
    if (path.includes('template')) {
        return false;
    }

    // 排除文档属性图片
    if (path.includes('docprops')) {
        return false;
    }

    return true;
}

/**
 * 压缩 PPTX 中的图片
 * @param {Array} images - 图片数组
 * @param {number} quality - 压缩质量 (1-100)
 * @param {string} format - 输出格式 (png, jpeg, webp)
 * @param {Function} progressCallback - 进度回调函数
 * @returns {Promise<Object>} { compressedImages: Array, totalSaved: number }
 */
async function compressPptxImages(images, quality, format, progressCallback) {
    const compressedImages = [];
    let totalSaved = 0;
    let processedCount = 0;

    for (const image of images) {
        try {
            // 读取图片为 Image 对象
            const img = await loadImage(image.blob);

            // 获取原始图片格式
            const originalFormat = image.name.split('.').pop().toLowerCase();
            
            // 智能决策：是否需要压缩
            let shouldCompress = true;
            let targetFormat = format;
            let targetQuality = quality;

            // 如果原始格式已经是 JPG/WebP 且质量较低，可能不需要压缩
            if ((originalFormat === 'jpg' || originalFormat === 'jpeg' || originalFormat === 'webp') && quality >= 80) {
                // 检查原始图片是否已经足够小
                if (image.blob.size < 500 * 1024) { // 小于 500KB
                    shouldCompress = false;
                }
            }

            // 如果需要压缩
            if (shouldCompress) {
                // 创建 Canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 设置 Canvas 尺寸
                canvas.width = img.width;
                canvas.height = img.height;

                // 绘制图片到 Canvas
                ctx.drawImage(img, 0, 0);

                // 转换为指定格式
                const mimeType = `image/${format === 'jpeg' ? 'jpeg' : format}`;
                const qualityValue = quality / 100;

                const compressedBlob = await new Promise((resolve, reject) => {
                    canvas.toBlob(function(blob) {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('无法压缩图片'));
                        }
                    }, mimeType, qualityValue);
                });

                // 计算节省的空间
                const saved = image.blob.size - compressedBlob.size;
                totalSaved += saved;

                compressedImages.push({
                    originalName: image.name,
                    compressedBlob: compressedBlob,
                    originalSize: image.blob.size,
                    compressedSize: compressedBlob.size,
                    saved: saved,
                    path: image.path
                });
            } else {
                // 不压缩，使用原始图片
                compressedImages.push({
                    originalName: image.name,
                    compressedBlob: image.blob,
                    originalSize: image.blob.size,
                    compressedSize: image.blob.size,
                    saved: 0,
                    path: image.path,
                    skipped: true
                });
            }

            // 更新进度
            processedCount++;
            if (progressCallback) {
                progressCallback(processedCount, images.length);
            }
        } catch (error) {
            console.error(`压缩图片 ${image.name} 失败:`, error);
            // 失败时使用原始图片
            compressedImages.push({
                originalName: image.name,
                compressedBlob: image.blob,
                originalSize: image.blob.size,
                compressedSize: image.blob.size,
                saved: 0,
                path: image.path,
                error: error.message
            });
        }
    }

    return {
        compressedImages,
        totalSaved
    };
}

/**
 * 重新打包为 PPTX 文件
 * @param {JSZip} zip - 原始 ZIP 对象
 * @param {Array} compressedImages - 压缩后的图片数组
 * @param {string} originalFileName - 原始文件名
 * @returns {Promise<Blob>} 新的 PPTX 文件 Blob
 */
async function repackagePptx(zip, compressedImages, originalFileName) {
    try {
        // 替换 ZIP 中的图片文件
        for (const compressedImage of compressedImages) {
            if (!compressedImage.error) {
                // 删除原始文件
                zip.remove(compressedImage.path);

                // 添加压缩后的文件
                zip.file(compressedImage.path, compressedImage.compressedBlob);
            }
        }

        // 生成新的 ZIP 文件
        const newPptxBlob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            compression: 'DEFLATE'
        });

        return newPptxBlob;
    } catch (error) {
        console.error('重新打包 PPTX 失败:', error);
        throw new Error(`重新打包 PPTX 失败: ${error.message}`);
    }
}

/**
 * 处理 PPTX 文件的主函数 - 提取并转换为图片格式
 * @param {File} pptxFile - PPTX 文件对象
 * @param {Object} options - 处理选项
 * @param {number} options.quality - 压缩质量 (1-100)
 * @param {string} options.format - 输出格式 (png, jpeg, webp)
 * @param {Function} options.onProgress - 进度回调
 * @param {Set} options.processedHashes - 已处理图片的哈希值集合（用于去重）
 * @returns {Promise<Object>} 处理结果 - 返回多个转换后的图片
 */
async function processPptxFile(pptxFile, options = {}) {
    const {
        quality = 80,
        format = 'jpeg',
        onProgress = null,
        processedHashes = null // 新增：去重哈希集合
    } = options;

    console.log('=== processPptxFile 被调用 ===');
    console.log('PPTX文件名:', pptxFile.name);
    console.log('PPTX文件大小:', pptxFile.size);
    console.log('堆栈跟踪:', new Error().stack);

    try {
        // 1. 提取图片
        const { images } = await extractImagesFromPptx(pptxFile);

        console.log('extractImagesFromPptx返回的图片数量:', images.length);
        console.log('图片详情:', images.map(img => ({name: img.name, size: img.size, path: img.path})));

        if (images.length === 0) {
            throw new Error('PPTX 文件中未找到图片资源');
        }

        // 2. 转换图片格式
        const convertedImages = [];
        let totalSaved = 0;
        let duplicateCount = 0; // 去重统计：跳过的重复图片数

        for (let i = 0; i < images.length; i++) {
            const image = images[i];

            console.log(`处理图片 ${i+1}/${images.length}:`, image.name);

            // 只在需要去重时计算哈希（性能优化）
            if (processedHashes) {
                const originalHash = await calculateImageHash(image.blob);
                console.log(`  图片哈希值: ${originalHash.substring(0, 16)}...`);

                // 检查是否已处理过相同内容的图片
                if (processedHashes.has(originalHash)) {
                    console.log(`  跳过重复图片（哈希: ${originalHash.substring(0, 16)}...）`);
                    duplicateCount++; // 增加去重计数
                    continue; // 跳过重复图片
                }

                // 记录哈希值
                processedHashes.add(originalHash);
            }

            if (onProgress) {
                onProgress({
                    stage: 'converting',
                    processed: i + 1,
                    total: images.length,
                    message: `正在转换图片 ${i + 1}/${images.length}...`
                });
            }

            try {
                // 读取图片为 Image 对象
                const img = await loadImage(image.blob);

                // 创建 Canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 设置 Canvas 尺寸
                canvas.width = img.width;
                canvas.height = img.height;

                // 绘制图片到 Canvas
                ctx.drawImage(img, 0, 0);

                // 转换为指定格式
                const mimeType = `image/${format === 'jpeg' ? 'jpeg' : format}`;
                const qualityValue = quality / 100;

                const convertedBlob = await new Promise((resolve, reject) => {
                    canvas.toBlob(function(blob) {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('无法转换图片'));
                        }
                    }, mimeType, qualityValue);
                });

                // 计算节省的空间
                const saved = image.blob.size - convertedBlob.size;
                totalSaved += saved;

                // 生成新文件名
                const baseName = image.name.replace(/\.[^/.]+$/, '');
                const newFileName = `${baseName}.${format}`;

                convertedImages.push({
                    originalName: image.name,
                    convertedName: newFileName,
                    originalBlob: image.blob,
                    convertedBlob: convertedBlob,
                    originalSize: image.blob.size,
                    convertedSize: convertedBlob.size,
                    saved: saved,
                    path: image.path
                });
            } catch (error) {
                console.error(`转换图片 ${image.name} 失败:`, error);
                // 失败时使用原始图片
                convertedImages.push({
                    originalName: image.name,
                    convertedName: image.name,
                    originalBlob: image.blob,
                    convertedBlob: image.blob,
                    originalSize: image.blob.size,
                    convertedSize: image.blob.size,
                    saved: 0,
                    path: image.path,
                    error: error.message
                });
            }
        }

        const result = {
            success: true,
            originalFile: pptxFile,
            originalSize: pptxFile.size,
            images: convertedImages,
            imageCount: images.length,
            convertedImageCount: convertedImages.filter(img => !img.error).length,
            totalSaved: totalSaved,
            format: format,
            duplicateCount: duplicateCount // 添加去重统计
        };

        return result;
    } catch (error) {
        console.error('处理 PPTX 文件失败:', error);
        const errorResult = {
            success: false,
            error: error.message,
            originalFile: pptxFile
        };

        throw error;
    }
}

/**
 * 加载图片为 Image 对象
 * @param {Blob} blob - 图片 Blob
 * @returns {Promise<HTMLImageElement>} Image 对象
 */
function loadImage(blob) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = function() {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = function() {
            URL.revokeObjectURL(url);
            reject(new Error('无法加载图片'));
        };

        img.src = url;
    });
}

/**
 * 获取 PPTX 文件信息
 * @param {File} pptxFile - PPTX 文件对象
 * @returns {Promise<Object>} 文件信息
 */
async function getPptxInfo(pptxFile) {
    try {
        const { images, zip } = await extractImagesFromPptx(pptxFile);

        let totalImageSize = 0;
        const imageTypes = {};

        images.forEach(img => {
            totalImageSize += img.blob.size;
            const ext = img.name.split('.').pop().toLowerCase();
            imageTypes[ext] = (imageTypes[ext] || 0) + 1;
        });

        return {
            fileName: pptxFile.name,
            fileSize: pptxFile.size,
            imageCount: images.length,
            totalImageSize: totalImageSize,
            imageTypes: imageTypes,
            imageRatio: ((totalImageSize / pptxFile.size) * 100).toFixed(1)
        };
    } catch (error) {
        console.error('获取 PPTX 信息失败:', error);
        throw error;
    }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        extractImagesFromPptx,
        compressPptxImages,
        repackagePptx,
        processPptxFile,
        getPptxInfo
    };
} else {
    window.PptxProcessor = {
        extractImagesFromPptx,
        compressPptxImages,
        repackagePptx,
        processPptxFile,
        getPptxInfo
    };
}