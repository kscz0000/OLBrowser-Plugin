/**
 * 安全存储模块
 * 提供加密的本地存储功能，保护用户设置和敏感数据
 * 创建时间：2025-12-15
 */

 // 存储键前缀
const STORAGE_PREFIX = 'img_secure_';

// 加密密钥（使用用户代理和随机盐生成）
let encryptionKey = null;

// 存储类型
const STORAGE_TYPES = {
    LOCAL: 'localStorage',
    SESSION: 'sessionStorage'
};

// 数据版本控制
const DATA_VERSION = '2.0';

/**
 * 生成加密密钥
 * @returns {Promise<Uint8Array>}
 */
async function generateEncryptionKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array;
}

/**
 * 初始化加密密钥
 * @returns {Promise<string>} 加密密钥
 */
async function initializeEncryptionKey() {
    if (encryptionKey) {
        return encryptionKey;
    }

    try {
        // 尝试从安全存储获取现有密钥
        const storedKey = localStorage.getItem(`${STORAGE_PREFIX}key`);
        if (storedKey) {
            encryptionKey = storedKey;
            return encryptionKey;
        }

        // 生成新的密钥
        const userAgent = navigator.userAgent;
        const timestamp = Date.now().toString();
        const randomString = generateRandomString(32);
        
        // 组合并哈希生成密钥
        const keyMaterial = `${userAgent}|${timestamp}|${randomString}`;
        const keyBuffer = await hashString(keyMaterial);
        encryptionKey = arrayBufferToBase64(keyBuffer);
        
        // 存储密钥
        localStorage.setItem(`${STORAGE_PREFIX}key`, encryptionKey);
        
        return encryptionKey;
    } catch (error) {
        console.warn('初始化加密密钥失败，使用降级方案:', error);
        // 降级方案：使用简单的密钥
        encryptionKey = 'fallback_key_' + Date.now();
        return encryptionKey;
    }
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 哈希字符串
 * @param {string} text - 要哈希的文本
 * @returns {Promise<ArrayBuffer>} 哈希结果
 */
async function hashString(text) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return hashBuffer;
    } catch (error) {
        // 如果Web Crypto API不可用，使用简单的哈希
        console.warn('Web Crypto API不可用，使用简单哈希');
        const simpleHash = simpleStringHash(text);
        return new TextEncoder().encode(simpleHash).buffer;
    }
}

/**
 * 简单字符串哈希（降级方案）
 * @param {string} text - 要哈希的文本
 * @returns {string} 哈希结果
 */
function simpleStringHash(text) {
    let hash = 0;
    if (text.length === 0) return hash.toString();
    
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash).toString(16);
}

/**
 * ArrayBuffer转Base64
 * @param {ArrayBuffer} buffer - ArrayBuffer
 * @returns {string} Base64字符串
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Base64转ArrayBuffer
 * @param {string} base64 - Base64字符串
 * @returns {ArrayBuffer} ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * 简单XOR加密（降级方案）
 * @param {string} text - 要加密的文本
 * @param {string} key - 加密密钥
 * @returns {string} 加密后的文本
 */
function simpleXorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
            text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }
    return btoa(result); // Base64编码
}

/**
 * 简单XOR解密（降级方案）
 * @param {string} encryptedText - 加密的文本
 * @param {string} key - 解密密钥
 * @returns {string} 解密后的文本
 */
function simpleXorDecrypt(encryptedText, key) {
    try {
        const text = atob(encryptedText); // Base64解码
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    } catch (error) {
        console.error('解密失败:', error);
        return null;
    }
}

/**
 * 生成数据完整性校验码
 * @param {string} data - 数据
 * @param {string} key - 密钥
 * @returns {Promise<string>}
 */
async function generateChecksum(data, key) {
    const content = `${data}|${key}|${DATA_VERSION}`;
    const hashBuffer = await hashString(content);
    return arrayBufferToBase64(hashBuffer);
}

/**
 * 加密数据
 * @param {string} data - 要加密的数据
 * @returns {Promise<string>} 加密后的数据
 */
async function encryptData(data) {
    try {
        await initializeEncryptionKey();
        
        // 生成校验码
        const checksum = await generateChecksum(data, encryptionKey);
        
        // 组合数据和校验码
        const fullData = JSON.stringify({
            data: data,
            checksum: checksum,
            version: DATA_VERSION,
            timestamp: Date.now()
        });
        
        // 尝试使用Web Crypto API
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            try {
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(fullData);
                const keyBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(encryptionKey));
                
                // 简单的加密方案：使用密钥进行XOR
                const encryptedBuffer = new Uint8Array(dataBuffer.length);
                const keyBytes = new Uint8Array(keyBuffer);
                
                for (let i = 0; i < dataBuffer.length; i++) {
                    encryptedBuffer[i] = dataBuffer[i] ^ keyBytes[i % keyBytes.length];
                }
                
                return arrayBufferToBase64(encryptedBuffer.buffer);
            } catch (cryptoError) {
                console.warn('Web Crypto加密失败，使用降级方案:', cryptoError);
            }
        }
        
        // 降级方案：简单XOR加密
        return simpleXorEncrypt(fullData, encryptionKey);
    } catch (error) {
        console.error('加密数据失败:', error);
        // 如果加密失败，返回Base64编码的原始数据
        return btoa(data);
    }
}

/**
 * 解密数据
 * @param {string} encryptedData - 加密的数据
 * @returns {Promise<string|null>} 解密后的数据
 */
async function decryptData(encryptedData) {
    try {
        await initializeEncryptionKey();
        
        let fullData;
        
        // 尝试使用Web Crypto API
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            try {
                const encryptedBuffer = base64ToArrayBuffer(encryptedData);
                const keyBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(encryptionKey));
                
                // 解密
                const decryptedBuffer = new Uint8Array(encryptedBuffer);
                const keyBytes = new Uint8Array(keyBuffer);
                
                for (let i = 0; i < decryptedBuffer.length; i++) {
                    decryptedBuffer[i] = decryptedBuffer[i] ^ keyBytes[i % keyBytes.length];
                }
                
                const decoder = new TextDecoder();
                fullData = decoder.decode(decryptedBuffer);
            } catch (cryptoError) {
                console.warn('Web Crypto解密失败，使用降级方案:', cryptoError);
                fullData = simpleXorDecrypt(encryptedData, encryptionKey);
            }
        } else {
            // 降级方案：简单XOR解密
            fullData = simpleXorDecrypt(encryptedData, encryptionKey);
        }
        
        if (!fullData) {
            return null;
        }
        
        // 解析数据
        let parsed;
        try {
            parsed = JSON.parse(fullData);
        } catch (e) {
            // 如果无法解析，说明不是加密数据，可能是原始数据
            return fullData;
        }
        
        // 验证数据完整性
        if (parsed.checksum && parsed.version === DATA_VERSION) {
            const expectedChecksum = await generateChecksum(parsed.data, encryptionKey);
            if (parsed.checksum !== expectedChecksum) {
                console.warn('数据完整性校验失败');
                return null;
            }
        }
        
        return parsed.data;
    } catch (error) {
        console.error('解密数据失败:', error);
        return null;
    }
}

/**
 * 安全存储数据
 * @param {string} key - 存储键
 * @param {any} data - 要存储的数据
 * @param {string} storageType - 存储类型
 * @returns {Promise<boolean>} 是否成功
 */
async function secureSetItem(key, data, storageType = STORAGE_TYPES.LOCAL) {
    try {
        const storage = storageType === STORAGE_TYPES.SESSION ? sessionStorage : localStorage;
        
        // 序列化数据
        const serializedData = JSON.stringify({
            data: data,
            timestamp: Date.now(),
            version: '1.0'
        });
        
        // 加密数据
        const encryptedData = await encryptData(serializedData);
        
        // 存储加密的数据
        storage.setItem(`${STORAGE_PREFIX}${key}`, encryptedData);
        
        return true;
    } catch (error) {
        console.error('安全存储失败:', error);
        return false;
    }
}

/**
 * 安全获取数据
 * @param {string} key - 存储键
 * @param {string} storageType - 存储类型
 * @param {number} maxAge - 最大有效期（毫秒），0表示不检查
 * @returns {Promise<any|null>} 存储的数据
 */
async function secureGetItem(key, storageType = STORAGE_TYPES.LOCAL, maxAge = 0) {
    try {
        const storage = storageType === STORAGE_TYPES.SESSION ? sessionStorage : localStorage;
        
        // 获取加密的数据
        const encryptedData = storage.getItem(`${STORAGE_PREFIX}${key}`);
        if (!encryptedData) {
            return null;
        }
        
        // 解密数据
        const decryptedData = await decryptData(encryptedData);
        if (!decryptedData) {
            // 如果解密失败，清除损坏的数据
            console.warn(`解密失败，清除损坏的数据: ${key}`);
            console.warn(`加密数据内容:`, encryptedData ? encryptedData.substring(0, 100) + (encryptedData.length > 100 ? '...' : '') : 'null');
            secureRemoveItem(key, storageType);
            return null;
        }
        
        // 反序列化数据
        let parsedData;
        try {
            // 检查解密后的数据是否为空或无效
            if (!decryptedData || typeof decryptedData !== 'string') {
                console.warn(`解密后的数据无效: ${key}`, typeof decryptedData, decryptedData);
                secureRemoveItem(key, storageType);
                return null;
            }
            
            // 检查数据是否以有效的JSON字符开头
            const trimmedData = decryptedData.trim();
            if (trimmedData.length === 0) {
                console.warn(`解密后的数据为空: ${key}`);
                secureRemoveItem(key, storageType);
                return null;
            }
            
            // 检查是否以 { 或 [ 开头（有效的JSON对象或数组）
            if (!trimmedData.startsWith('{') && !trimmedData.startsWith('[')) {
                console.warn(`解密后的数据不是有效的JSON格式: ${key}`, trimmedData.substring(0, 50) + (trimmedData.length > 50 ? '...' : ''));
                secureRemoveItem(key, storageType);
                return null;
            }
            
            // 尝试解析JSON
            parsedData = JSON.parse(decryptedData);
        } catch (parseError) {
            // 如果JSON解析失败，说明数据已损坏，清除它
            console.warn(`JSON解析失败，清除损坏的数据: ${key}`, parseError);
            console.warn(`损坏的数据内容:`, decryptedData ? decryptedData.substring(0, 100) + (decryptedData.length > 100 ? '...' : '') : 'null');
            
            // 特别记录错误位置
            if (decryptedData && decryptedData.length > 1) {
                console.warn(`数据前两个字符:`, decryptedData.substring(0, 2));
            }
            
            secureRemoveItem(key, storageType);
            return null;
        }
        
        // 检查数据有效期
        if (maxAge > 0 && Date.now() - parsedData.timestamp > maxAge) {
            secureRemoveItem(key, storageType);
            return null;
        }
        
        return parsedData.data;
    } catch (error) {
        console.error('安全获取失败:', error);
        // 发生错误时，尝试清除可能损坏的数据
        try {
            secureRemoveItem(key, storageType);
        } catch (removeError) {
            console.error('清除损坏数据时出错:', removeError);
        }
        return null;
    }
}

/**
 * 安全删除数据
 * @param {string} key - 存储键
 * @param {string} storageType - 存储类型
 * @returns {boolean} 是否成功
 */
function secureRemoveItem(key, storageType = STORAGE_TYPES.LOCAL) {
    try {
        const storage = storageType === STORAGE_TYPES.SESSION ? sessionStorage : localStorage;
        storage.removeItem(`${STORAGE_PREFIX}${key}`);
        return true;
    } catch (error) {
        console.error('安全删除失败:', error);
        return false;
    }
}

/**
 * 清空所有安全存储数据
 * @param {string} storageType - 存储类型
 * @returns {boolean} 是否成功
 */
function clearSecureStorage(storageType = STORAGE_TYPES.LOCAL) {
    try {
        const storage = storageType === STORAGE_TYPES.SESSION ? sessionStorage : localStorage;
        const keysToRemove = [];
        
        // 遍历所有键，找出我们的前缀键
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        
        // 删除所有找到的键
        keysToRemove.forEach(key => storage.removeItem(key));
        
        return true;
    } catch (error) {
        console.error('清空安全存储失败:', error);
        return false;
    }
}

/**
 * 获取所有安全存储的键
 * @param {string} storageType - 存储类型
 * @returns {Array<string>} 键列表
 */
function getSecureStorageKeys(storageType = STORAGE_TYPES.LOCAL) {
    try {
        const storage = storageType === STORAGE_TYPES.SESSION ? sessionStorage : localStorage;
        const keys = [];
        
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                keys.push(key.substring(STORAGE_PREFIX.length));
            }
        }
        
        return keys;
    } catch (error) {
        console.error('获取安全存储键失败:', error);
        return [];
    }
}

/**
 * 检查存储空间使用情况
 * @returns {Object} 存储空间信息
 */
function getStorageInfo() {
    try {
        const localStorageUsed = new Blob([localStorage.getItem(localStorage.key(0)) || '']).size;
        const sessionStorageUsed = new Blob([sessionStorage.getItem(sessionStorage.key(0)) || '']).size;
        
        // 估算已用空间
        let localStorageTotal = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                localStorageTotal += new Blob([localStorage.getItem(key)]).size;
            }
        }
        
        let sessionStorageTotal = 0;
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key) {
                sessionStorageTotal += new Blob([sessionStorage.getItem(key)]).size;
            }
        }
        
        return {
            localStorage: {
                used: localStorageTotal,
                estimated: localStorageTotal,
                quota: '5MB (estimated)'
            },
            sessionStorage: {
                used: sessionStorageTotal,
                estimated: sessionStorageTotal,
                quota: '5MB (estimated)'
            }
        };
    } catch (error) {
        console.error('获取存储信息失败:', error);
        return {
            localStorage: { used: 0, estimated: 0, quota: 'Unknown' },
            sessionStorage: { used: 0, estimated: 0, quota: 'Unknown' }
        };
    }
}

// 手动清理损坏的压缩设置数据
async function clearCorruptedCompressionSettings() {
    try {
        console.log('正在清理可能损坏的压缩设置数据...');
        await secureRemoveItem('compressionSettings', STORAGE_TYPES.LOCAL);
        console.log('压缩设置数据已清理完成');
        return true;
    } catch (error) {
        console.error('清理压缩设置数据失败:', error);
        return false;
    }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        secureSetItem,
        secureGetItem,
        secureRemoveItem,
        clearSecureStorage,
        getSecureStorageKeys,
        getStorageInfo,
        clearCorruptedCompressionSettings,
        STORAGE_TYPES
    };
} else {
    window.SecureStorage = {
        secureSetItem,
        secureGetItem,
        secureRemoveItem,
        clearSecureStorage,
        getSecureStorageKeys,
        getStorageInfo,
        clearCorruptedCompressionSettings,
        STORAGE_TYPES
    };
}