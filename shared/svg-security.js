/**
 * SVG安全清理模块
 * 用于清理和验证SVG内容，防止XSS攻击和恶意代码注入
 * 创建时间：2025-12-15
 */

// 危险标签黑名单
const DANGEROUS_TAGS = [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'link',
    'meta',
    'style'
];

// 危险属性黑名单
const DANGEROUS_ATTRIBUTES = [
    'onload',
    'onerror',
    'onclick',
    'onmouseover',
    'onmouseout',
    'onfocus',
    'onblur',
    'onkeydown',
    'onkeyup',
    'onkeypress',
    'onsubmit',
    'onreset',
    'onchange',
    'onselect',
    'javascript:',
    'vbscript:',
    'data:',
    'href',
    'src',
    'xlink:href',
    'xmlns:xlink'
];

// 允许的命名空间
const ALLOWED_NAMESPACES = {
    'http://www.w3.org/2000/svg': true,
    'http://www.w3.org/1999/xlink': true
};

// 最大文件大小限制（5MB）
const MAX_SVG_SIZE = 5 * 1024 * 1024;

/**
 * 清理SVG内容，移除潜在的危险元素和属性
 * @param {string} svgContent - 原始SVG内容
 * @returns {Object} { cleanedSvg: string, isValid: boolean, errors: string[] }
 */
function sanitizeSvg(svgContent) {
    const result = {
        cleanedSvg: '',
        isValid: true,
        errors: []
    };

    try {
        // 检查文件大小
        if (svgContent.length > MAX_SVG_SIZE) {
            result.isValid = false;
            result.errors.push(`SVG文件过大，最大允许${MAX_SVG_SIZE / 1024 / 1024}MB`);
            return result;
        }

        // 解析SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        
        // 检查解析错误
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            result.isValid = false;
            result.errors.push('SVG格式无效，无法解析');
            return result;
        }

        // 获取根元素
        const svgElement = doc.querySelector('svg');
        if (!svgElement) {
            result.isValid = false;
            result.errors.push('未找到有效的SVG根元素');
            return result;
        }

        // 验证命名空间
        const svgNamespace = svgElement.getAttribute('xmlns');
        if (svgNamespace && !ALLOWED_NAMESPACES[svgNamespace]) {
            result.isValid = false;
            result.errors.push('不允许的SVG命名空间');
            return result;
        }

        // 确保有标准命名空间
        if (!svgNamespace) {
            svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }

        // 递归清理元素
        cleanElement(svgElement);

        // 序列化清理后的SVG
        const serializer = new XMLSerializer();
        result.cleanedSvg = serializer.serializeToString(svgElement);

        // 最终验证
        const finalValidation = validateFinalSvg(result.cleanedSvg);
        if (!finalValidation.isValid) {
            result.isValid = false;
            result.errors = result.errors.concat(finalValidation.errors);
        }

        return result;
    } catch (error) {
        result.isValid = false;
        result.errors.push(`清理过程出错: ${error.message}`);
        return result;
    }
}

/**
 * 递归清理元素和属性
 * @param {Element} element - 要清理的DOM元素
 */
function cleanElement(element) {
    // 移除危险元素
    if (DANGEROUS_TAGS.includes(element.tagName.toLowerCase())) {
        element.parentNode.removeChild(element);
        return;
    }

    // 清理属性
    const attributes = Array.from(element.attributes);
    attributes.forEach(attr => {
        const attrName = attr.name.toLowerCase();
        
        // 检查是否为危险属性
        const isDangerous = DANGEROUS_ATTRIBUTES.some(dangerous => 
            attrName.includes(dangerous.toLowerCase())
        );
        
        if (isDangerous) {
            element.removeAttribute(attr.name);
        }
        
        // 检查属性值中的危险内容
        if (attr.value && typeof attr.value === 'string') {
            if (containsDangerousContent(attr.value)) {
                element.removeAttribute(attr.name);
            }
        }
    });

    // 递归处理子元素
    const children = Array.from(element.children);
    children.forEach(child => cleanElement(child));
}

/**
 * 检查字符串是否包含危险内容
 * @param {string} content - 要检查的内容
 * @returns {boolean} 是否包含危险内容
 */
function containsDangerousContent(content) {
    const dangerousPatterns = [
        /javascript:/gi,
        /vbscript:/gi,
        /data:(?!image\/)/gi,
        /<script/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /expression\s*\(/gi
    ];

    return dangerousPatterns.some(pattern => pattern.test(content));
}

/**
 * 最终验证清理后的SVG
 * @param {string} svgContent - 清理后的SVG内容
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateFinalSvg(svgContent) {
    const result = {
        isValid: true,
        errors: []
    };

    try {
        // 再次解析验证
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            result.isValid = false;
            result.errors.push('清理后的SVG格式无效');
        }

        // 检查是否还有危险标签
        DANGEROUS_TAGS.forEach(tag => {
            if (svgContent.toLowerCase().includes(`<${tag}`)) {
                result.isValid = false;
                result.errors.push(`清理后仍包含危险标签: ${tag}`);
            }
        });

        // 检查是否还有危险属性
        DANGEROUS_ATTRIBUTES.forEach(attr => {
            if (svgContent.toLowerCase().includes(attr)) {
                result.isValid = false;
                result.errors.push(`清理后仍包含危险属性: ${attr}`);
            }
        });

    } catch (error) {
        result.isValid = false;
        result.errors.push(`最终验证出错: ${error.message}`);
    }

    return result;
}

/**
 * 安全地获取SVG尺寸
 * @param {string} svgContent - SVG内容
 * @returns {Object} { width: number, height: number, isValid: boolean }
 */
function getSvgDimensions(svgContent) {
    const result = {
        width: 300,
        height: 300,
        isValid: true
    };

    try {
        const sanitizationResult = sanitizeSvg(svgContent);
        if (!sanitizationResult.isValid) {
            result.isValid = false;
            return result;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitizationResult.cleanedSvg, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');

        if (!svgElement) {
            result.isValid = false;
            return result;
        }

        // 获取尺寸
        const widthAttr = svgElement.getAttribute('width');
        const heightAttr = svgElement.getAttribute('height');

        if (widthAttr && heightAttr) {
            result.width = Math.max(parseFloat(widthAttr), 1);
            result.height = Math.max(parseFloat(heightAttr), 1);
        } else {
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.split(/\s+|,/);
                if (parts.length === 4) {
                    result.width = Math.max(parseFloat(parts[2]) - parseFloat(parts[0]), 1);
                    result.height = Math.max(parseFloat(parts[3]) - parseFloat(parts[1]), 1);
                }
            }
        }

        // 限制最大尺寸
        result.width = Math.min(result.width, 8192);
        result.height = Math.min(result.height, 8192);

        return result;
    } catch (error) {
        result.isValid = false;
        return result;
    }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeSvg,
        getSvgDimensions,
        DANGEROUS_TAGS,
        DANGEROUS_ATTRIBUTES,
        MAX_SVG_SIZE
    };
} else {
    window.SvgSecurity = {
        sanitizeSvg,
        getSvgDimensions,
        DANGEROUS_TAGS,
        DANGEROUS_ATTRIBUTES,
        MAX_SVG_SIZE
    };
}