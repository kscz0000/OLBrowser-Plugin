/**
 * 文件验证模块
 * 用于验证上传的文件类型、大小和内容
 * 创建时间：2025-12-15
 */

// 支持的图像文件类型
const SUPPORTED_IMAGE_TYPES = {
    'image/jpeg': {
        extensions: ['.jpg', '.jpeg'],
        maxSize: 50 * 1024 * 1024, // 50MB
        description: 'JPEG图像'
    },
    'image/png': {
        extensions: ['.png'],
        maxSize: 50 * 1024 * 1024, // 50MB
        description: 'PNG图像'
    },
    'image/webp': {
        extensions: ['.webp'],
        maxSize: 50 * 1024 * 1024, // 50MB
        description: 'WebP图像'
    },
    'image/gif': {
        extensions: ['.gif'],
        maxSize: 20 * 1024 * 1024, // 20MB
        description: 'GIF动画'
    },
    'image/bmp': {
        extensions: ['.bmp'],
        maxSize: 50 * 1024 * 1024, // 50MB
        description: 'BMP图像'
    },
    'image/svg+xml': {
        extensions: ['.svg'],
        maxSize: 5 * 1024 * 1024, // 5MB
        description: 'SVG矢量图'
    }
};

// 危险文件扩展名黑名单
const DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.app', '.deb', '.pkg', '.dmg', '.rpm', '.deb', '.msi', '.msp', '.msu'
];

// 魔数（文件签名）验证
const FILE_SIGNATURES = {
    'image/jpeg': [
        [0xFF, 0xD8, 0xFF], // JPEG
        [0xFF, 0xD8, 0xFF, 0xE0], // JPEG with JFIF
        [0xFF, 0xD8, 0xFF, 0xE1] // JPEG with EXIF
    ],
    'image/png': [
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
    ],
    'image/webp': [
        [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
        [0x57, 0x45, 0x42, 0x50]  // WEBP
    ],
    'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
    ],
    'image/bmp': [
        [0x42, 0x4D] // BM
    ]
};

/**
 * 验证文件
 * @param {File} file - 要验证的文件
 * @param {Object} options - 验证选项
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[] }
 */
function validateFile(file, options = {}) {
    const result = {
        isValid: true,
        errors: [],
        warnings: []
    };

    try {
        // 1. 检查文件是否存在
        if (!file) {
            result.isValid = false;
            result.errors.push('文件不存在');
            return result;
        }

        // 2. 检查文件名
        if (!file.name || typeof file.name !== 'string') {
            result.isValid = false;
            result.errors.push('文件名无效');
            return result;
        }

        // 3. 检查危险扩展名
        const fileExt = getFileExtension(file.name).toLowerCase();
        if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
            result.isValid = false;
            result.errors.push(`不允许的文件类型: ${fileExt}`);
            return result;
        }

        // 4. 检查MIME类型
        const mimeType = file.type.toLowerCase();
        // 如果MIME类型为空或未知，尝试通过文件扩展名推断
        if (!mimeType || mimeType === 'application/octet-stream' || !SUPPORTED_IMAGE_TYPES[mimeType]) {
            // 通过扩展名尝试推断MIME类型
            const fileExt = getFileExtension(file.name).toLowerCase();
            let inferredMimeType = null;
            
            // 查找匹配的MIME类型
            for (const [mime, info] of Object.entries(SUPPORTED_IMAGE_TYPES)) {
                if (info.extensions.includes(fileExt)) {
                    inferredMimeType = mime;
                    break;
                }
            }
            
            // 如果无法推断，仍然允许文件上传但给出警告
            if (!inferredMimeType) {
                result.warnings.push('无法确定文件类型，但仍允许上传');
            }
        }

        // 5. 检查扩展名与MIME类型是否匹配
        const supportedType = SUPPORTED_IMAGE_TYPES[mimeType];
        if (supportedType && !supportedType.extensions.includes(fileExt)) {
            result.isValid = false;
            result.errors.push(`文件扩展名 ${fileExt} 与MIME类型 ${mimeType} 不匹配`);
            return result;
        }

        // 6. 检查文件大小
        if (supportedType && file.size > supportedType.maxSize) {
            result.isValid = false;
            result.errors.push(`文件过大，最大允许 ${formatFileSize(supportedType.maxSize)}`);
            return result;
        }

        // 对于特别小的PNG文件，可能需要特殊处理
        if (file.type === 'image/png' && file.size < 100) {
            result.warnings.push('PNG文件过小，可能影响压缩效果');
        }

        // 7. 检查最小文件大小（防止空文件）
        if (file.size < 10) {
            result.isValid = false;
            result.errors.push('文件过小，可能已损坏');
            return result;
        }

        // 8. 文件名长度检查
        if (file.name.length > 255) {
            result.warnings.push('文件名过长，可能影响某些系统');
        }

        // 9. 检查文件名中的特殊字符
        const dangerousChars = /[<>:"|?*]/;
        if (dangerousChars.test(file.name)) {
            result.warnings.push('文件名包含特殊字符，建议重命名');
        }

        // 10. 对于PNG文件，提供更多上下文信息
        if (file.type === 'image/png') {
            if (file.size > 10 * 1024 * 1024) { // 大于10MB
                result.warnings.push('PNG文件较大，压缩可能需要较长时间');
            }
        }

        return result;
    } catch (error) {
        result.isValid = false;
        result.errors.push(`文件验证过程出错: ${error.message}`);
        return result;
    }
}

/**
 * 深度验证文件内容（通过文件头）
 * @param {File} file - 要验证的文件
 * @returns {Promise<Object>} { isValid: boolean, errors: string[] }
 */
async function validateFileContent(file) {
    const result = {
        isValid: true,
        errors: []
    };

    try {
        // 读取文件的前几个字节进行魔数验证
        const buffer = await readFileHeader(file, 16);
        
        // SVG文件不进行魔数验证（基于文本）
        if (file.type === 'image/svg+xml') {
            // 对于SVG，需要检查内容是否为有效的XML
            const text = await readFileAsText(file);
            const svgValidation = await validateSvgContent(text);
            if (!svgValidation.isValid) {
                result.isValid = false;
                result.errors = result.errors.concat(svgValidation.errors);
            }
            return result;
        }

        // 验证其他图像文件的魔数
        const signatures = FILE_SIGNATURES[file.type];
        if (!signatures) {
            result.errors.push(`不支持的文件类型: ${file.type}`);
            result.isValid = false;
            return result;
        }

        let validSignature = false;
        for (const signature of signatures) {
            if (matchesSignature(buffer, signature)) {
                validSignature = true;
                break;
            }
        }

        if (!validSignature) {
            result.isValid = false;
            result.errors.push('文件头签名不匹配，文件可能已损坏或伪装');
        }

        return result;
    } catch (error) {
        result.isValid = false;
        result.errors.push(`文件内容验证出错: ${error.message}`);
        return result;
    }
}

/**
 * 验证SVG内容
 * @param {string} svgContent - SVG内容
 * @returns {Promise<Object>} { isValid: boolean, errors: string[] }
 */
async function validateSvgContent(svgContent) {
    const result = {
        isValid: true,
        errors: []
    };

    try {
        // 如果有SVG安全模块，使用其验证功能
        if (typeof SvgSecurity !== 'undefined' && SvgSecurity.sanitizeSvg) {
            const sanitizationResult = SvgSecurity.sanitizeSvg(svgContent);
            if (!sanitizationResult.isValid) {
                result.isValid = false;
                result.errors = result.errors.concat(sanitizationResult.errors);
            }
            return result;
        }

        // 基础XML验证
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            result.isValid = false;
            result.errors.push('SVG格式无效，无法解析');
        }

        return result;
    } catch (error) {
        result.isValid = false;
        result.errors.push(`SVG内容验证出错: ${error.message}`);
        return result;
    }
}

/**
 * 读取文件头部
 * @param {File} file - 文件对象
 * @param {number} bytes - 要读取的字节数
 * @returns {Promise<Uint8Array>} 文件头数据
 */
function readFileHeader(file, bytes = 16) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result;
            resolve(new Uint8Array(arrayBuffer));
        };
        reader.onerror = () => reject(new Error('读取文件头失败'));
        reader.readAsArrayBuffer(file.slice(0, bytes));
    });
}

/**
 * 读取文件为文本
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 文件内容
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('读取文件文本失败'));
        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * 检查文件头是否匹配签名
 * @param {Uint8Array} buffer - 文件头数据
 * @param {Array<number>} signature - 文件签名
 * @returns {boolean} 是否匹配
 */
function matchesSignature(buffer, signature) {
    if (buffer.length < signature.length) {
        return false;
    }

    for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
            return false;
        }
    }

    return true;
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 文件扩展名（包含点号）
 */
function getFileExtension(filename) {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.slice(lastDotIndex) : '';
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 批量验证文件
 * @param {FileList|Array<File>} files - 文件列表
 * @param {Object} options - 验证选项
 * @returns {Promise<Object>} { validFiles: File[], invalidFiles: {file: File, errors: string[]}[] }
 */
async function validateMultipleFiles(files, options = {}) {
    const result = {
        validFiles: [],
        invalidFiles: []
    };

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
        // 基础验证
        const basicValidation = validateFile(file, options);
        if (!basicValidation.isValid) {
            result.invalidFiles.push({
                file,
                errors: basicValidation.errors,
                warnings: basicValidation.warnings
            });
            continue;
        }

        // 内容验证
        const contentValidation = await validateFileContent(file);
        if (!contentValidation.isValid) {
            result.invalidFiles.push({
                file,
                errors: contentValidation.errors,
                warnings: basicValidation.warnings
            });
            continue;
        }

        // 文件有效
        result.validFiles.push(file);
    }

    return result;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateFile,
        validateFileContent,
        validateMultipleFiles,
        SUPPORTED_IMAGE_TYPES,
        DANGEROUS_EXTENSIONS,
        FILE_SIGNATURES
    };
} else {
    window.FileValidator = {
        validateFile,
        validateFileContent,
        validateMultipleFiles,
        SUPPORTED_IMAGE_TYPES,
        DANGEROUS_EXTENSIONS,
        FILE_SIGNATURES
    };
}