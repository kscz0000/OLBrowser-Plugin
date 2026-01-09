/**
 * SVG安全清理模块
 * 用于清理和验证SVG内容，防止XSS攻击、XXE攻击和恶意代码注入
 * 创建时间：2025-12-15
 * 更新时间：2026-01-01 - 增强XXE攻击防护和SVG炸弹检测
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

// 最大元素数量限制（防止SVG炸弹）
const MAX_ELEMENT_COUNT = 10000;

// 最大嵌套深度限制（防止深度嵌套攻击）
const MAX_NESTING_DEPTH = 100;

// 最大动画持续时间限制（毫秒）
const MAX_ANIMATION_DURATION = 10000;

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
        // 1. 检查文件大小
        if (svgContent.length > MAX_SVG_SIZE) {
            result.isValid = false;
            result.errors.push(`SVG文件过大，最大允许${MAX_SVG_SIZE / 1024 / 1024}MB`);
            return result;
        }

        // 2. XXE攻击防护 - 移除DOCTYPE声明和XML实体
        const xxeCleanedContent = removeXXEVectors(svgContent);

        // 3. 解析SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(xxeCleanedContent, 'image/svg+xml');
        
        // 4. 检查解析错误
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            result.isValid = false;
            result.errors.push('SVG格式无效，无法解析');
            return result;
        }

        // 5. 获取根元素
        const svgElement = doc.querySelector('svg');
        if (!svgElement) {
            result.isValid = false;
            result.errors.push('未找到有效的SVG根元素');
            return result;
        }

        // 6. 验证命名空间
        const svgNamespace = svgElement.getAttribute('xmlns');
        if (svgNamespace && !ALLOWED_NAMESPACES[svgNamespace]) {
            result.isValid = false;
            result.errors.push('不允许的SVG命名空间');
            return result;
        }

        // 7. 确保有标准命名空间
        if (!svgNamespace) {
            svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }

        // 8. SVG炸弹检测 - 检查元素数量
        const elementCount = doc.querySelectorAll('*').length;
        if (elementCount > MAX_ELEMENT_COUNT) {
            result.isValid = false;
            result.errors.push(`SVG包含过多元素（${elementCount}个），超过限制${MAX_ELEMENT_COUNT}个`);
            return result;
        }

        // 9. 检查嵌套深度
        const maxDepth = calculateMaxDepth(svgElement);
        if (maxDepth > MAX_NESTING_DEPTH) {
            result.isValid = false;
            result.errors.push(`SVG嵌套深度过深（${maxDepth}层），超过限制${MAX_NESTING_DEPTH}层`);
            return result;
        }

        // 10. 检查动画持续时间
        const animationDuration = checkAnimationDuration(svgElement);
        if (animationDuration > MAX_ANIMATION_DURATION) {
            result.isValid = false;
            result.errors.push(`SVG动画持续时间过长（${animationDuration}ms），超过限制${MAX_ANIMATION_DURATION}ms`);
            return result;
        }

        // 11. 递归清理元素
        cleanElement(svgElement);

        // 12. 序列化清理后的SVG
        const serializer = new XMLSerializer();
        result.cleanedSvg = serializer.serializeToString(svgElement);

        // 13. 最终验证
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

/**
 * 移除XXE攻击向量（DOCTYPE声明、XML实体等）
 * @param {string} svgContent - 原始SVG内容
 * @returns {string} 清理后的SVG内容
 */
function removeXXEVectors(svgContent) {
    // 移除DOCTYPE声明
    let cleaned = svgContent.replace(/<!DOCTYPE[^>]*>/gi, '');
    
    // 移除XML实体声明
    cleaned = cleaned.replace(/<!ENTITY[^>]*>/gi, '');
    
    // 移除外部实体引用
    cleaned = cleaned.replace(/SYSTEM\s+["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/PUBLIC\s+["'][^"']*["']/gi, '');
    
    // 移除参数实体引用
    cleaned = cleaned.replace(/%[^;\s]+;/g, '');
    
    return cleaned;
}

/**
 * 计算DOM树的最大嵌套深度
 * @param {Element} element - 根元素
 * @returns {number} 最大嵌套深度
 */
function calculateMaxDepth(element) {
    let maxDepth = 0;
    
    function traverse(node, depth) {
        if (depth > maxDepth) {
            maxDepth = depth;
        }
        
        for (let i = 0; i < node.children.length; i++) {
            traverse(node.children[i], depth + 1);
        }
    }
    
    traverse(element, 0);
    return maxDepth;
}

/**
 * 检查SVG动画的总持续时间
 * @param {Element} svgElement - SVG根元素
 * @returns {number} 最大动画持续时间（毫秒）
 */
function checkAnimationDuration(svgElement) {
    let maxDuration = 0;
    
    // 检查animate元素的dur属性
    const animateElements = svgElement.querySelectorAll('animate, animateTransform, animateMotion');
    animateElements.forEach(el => {
        const dur = el.getAttribute('dur');
        if (dur) {
            const duration = parseDuration(dur);
            if (duration > maxDuration) {
                maxDuration = duration;
            }
        }
    });
    
    // 检查animation元素的repeatCount
    const animationElements = svgElement.querySelectorAll('animation');
    animationElements.forEach(el => {
        const repeatCount = el.getAttribute('repeatCount');
        const dur = el.getAttribute('dur');
        if (dur) {
            const duration = parseDuration(dur);
            if (repeatCount === 'indefinite') {
                // 无限循环，返回最大限制
                return MAX_ANIMATION_DURATION;
            } else if (repeatCount) {
                const count = parseFloat(repeatCount);
                if (!isNaN(count)) {
                    const totalDuration = duration * count;
                    if (totalDuration > maxDuration) {
                        maxDuration = totalDuration;
                    }
                }
            } else if (duration > maxDuration) {
                maxDuration = duration;
            }
        }
    });
    
    return maxDuration;
}

/**
 * 解析持续时间字符串
 * @param {string} durationStr - 持续时间字符串（如 "5s", "3000ms", "10min"）
 * @returns {number} 持续时间（毫秒）
 */
function parseDuration(durationStr) {
    const str = durationStr.toLowerCase().trim();
    
    if (str.endsWith('ms')) {
        return parseFloat(str.slice(0, -2)) || 0;
    } else if (str.endsWith('s')) {
        return (parseFloat(str.slice(0, -1)) || 0) * 1000;
    } else if (str.endsWith('min')) {
        return (parseFloat(str.slice(0, -3)) || 0) * 60000;
    } else if (str.endsWith('h')) {
        return (parseFloat(str.slice(0, -1)) || 0) * 3600000;
    } else {
        // 默认按秒处理
        return (parseFloat(str) || 0) * 1000;
    }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeSvg,
        getSvgDimensions,
        DANGEROUS_TAGS,
        DANGEROUS_ATTRIBUTES,
        MAX_SVG_SIZE,
        MAX_ELEMENT_COUNT,
        MAX_NESTING_DEPTH,
        MAX_ANIMATION_DURATION,
        removeXXEVectors,
        calculateMaxDepth,
        checkAnimationDuration
    };
} else {
    window.SvgSecurity = {
        sanitizeSvg,
        getSvgDimensions,
        DANGEROUS_TAGS,
        DANGEROUS_ATTRIBUTES,
        MAX_SVG_SIZE,
        MAX_ELEMENT_COUNT,
        MAX_NESTING_DEPTH,
        MAX_ANIMATION_DURATION,
        removeXXEVectors,
        calculateMaxDepth,
        checkAnimationDuration
    };
}