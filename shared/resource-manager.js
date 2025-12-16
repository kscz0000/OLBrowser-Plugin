/**
 * 资源管理模块
 * 用于管理系统资源，防止内存泄漏和资源竞争
 * 创建时间：2025-12-15
 */

// 资源类型枚举
const ResourceType = {
    URL: 'url',
    FILE_READER: 'fileReader',
    CANVAS: 'canvas',
    IMAGE: 'image',
    BLOB: 'blob',
    TIMER: 'timer',
    EVENT_LISTENER: 'eventListener'
};

// 资源管理器类
class ResourceManager {
    constructor() {
        this.resources = new Map(); // 存储所有资源
        this.resourceIdCounter = 0; // 资源ID计数器
        this.cleanupTasks = new Map(); // 清理任务
        this.maxResourceAge = 10 * 60 * 1000; // 资源最大存活时间（10分钟）
        this.cleanupInterval = null;
        
        // 启动定期清理
        this.startPeriodicCleanup();
    }

    /**
     * 注册资源
     * @param {any} resource - 资源对象
     * @param {ResourceType} type - 资源类型
     * @param {Object} metadata - 资源元数据
     * @returns {string} 资源ID
     */
    registerResource(resource, type, metadata = {}) {
        const resourceId = `resource_${++this.resourceIdCounter}`;
        const resourceInfo = {
            id: resourceId,
            resource,
            type,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            metadata,
            isReleased: false
        };

        this.resources.set(resourceId, resourceInfo);
        return resourceId;
    }

    /**
     * 访问资源
     * @param {string} resourceId - 资源ID
     * @returns {any|null} 资源对象
     */
    accessResource(resourceId) {
        const resourceInfo = this.resources.get(resourceId);
        if (resourceInfo && !resourceInfo.isReleased) {
            resourceInfo.lastAccessed = Date.now();
            return resourceInfo.resource;
        }
        return null;
    }

    /**
     * 释放资源
     * @param {string} resourceId - 资源ID
     * @returns {boolean} 是否成功释放
     */
    releaseResource(resourceId) {
        const resourceInfo = this.resources.get(resourceId);
        if (!resourceInfo || resourceInfo.isReleased) {
            return false;
        }

        try {
            switch (resourceInfo.type) {
                case ResourceType.URL:
                    if (typeof resourceInfo.resource === 'string' && resourceInfo.resource.startsWith('blob:')) {
                        URL.revokeObjectURL(resourceInfo.resource);
                    }
                    break;
                    
                case ResourceType.FILE_READER:
                    if (resourceInfo.resource && typeof resourceInfo.resource.abort === 'function') {
                        resourceInfo.resource.abort();
                    }
                    break;
                    
                case ResourceType.CANVAS:
                    if (resourceInfo.resource && typeof resourceInfo.resource.getContext === 'function') {
                        const ctx = resourceInfo.resource.getContext('2d');
                        if (ctx) {
                            ctx.clearRect(0, 0, resourceInfo.resource.width, resourceInfo.resource.height);
                        }
                    }
                    break;
                    
                case ResourceType.IMAGE:
                    if (resourceInfo.resource && typeof resourceInfo.resource.src === 'string') {
                        if (resourceInfo.resource.src.startsWith('blob:')) {
                            URL.revokeObjectURL(resourceInfo.resource.src);
                        }
                        resourceInfo.resource.src = '';
                    }
                    break;
                    
                case ResourceType.BLOB:
                    // Blob对象会自动清理，但我们可以移除引用
                    break;
                    
                case ResourceType.TIMER:
                    if (typeof resourceInfo.resource === 'number') {
                        clearTimeout(resourceInfo.resource);
                    } else if (resourceInfo.resource && typeof resourceInfo.resource.clear === 'function') {
                        resourceInfo.resource.clear();
                    }
                    break;
                    
                case ResourceType.EVENT_LISTENER:
                    if (resourceInfo.metadata.target && resourceInfo.metadata.event && resourceInfo.metadata.handler) {
                        resourceInfo.metadata.target.removeEventListener(
                            resourceInfo.metadata.event,
                            resourceInfo.metadata.handler
                        );
                    }
                    break;
            }

            resourceInfo.isReleased = true;
            resourceInfo.releasedAt = Date.now();
            return true;
        } catch (error) {
            console.warn(`释放资源 ${resourceId} 时出错:`, error);
            return false;
        }
    }

    /**
     * 批量释放资源
     * @param {Array<string>} resourceIds - 资源ID数组
     */
    releaseResources(resourceIds) {
        resourceIds.forEach(id => this.releaseResource(id));
    }

    /**
     * 根据类型释放资源
     * @param {ResourceType} type - 资源类型
     * @param {Function} filter - 可选的过滤函数
     */
    releaseResourcesByType(type, filter = null) {
        const resourcesToRelease = [];
        
        for (const [id, resourceInfo] of this.resources) {
            if (resourceInfo.type === type && !resourceInfo.isReleased) {
                if (!filter || filter(resourceInfo)) {
                    resourcesToRelease.push(id);
                }
            }
        }
        
        this.releaseResources(resourcesToRelease);
    }

    /**
     * 启动定期清理
     */
    startPeriodicCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredResources();
        }, 60 * 1000); // 每分钟清理一次
    }

    /**
     * 停止定期清理
     */
    stopPeriodicCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * 清理过期资源
     */
    cleanupExpiredResources() {
        const now = Date.now();
        const resourcesToRelease = [];
        
        for (const [id, resourceInfo] of this.resources) {
            if (!resourceInfo.isReleased && 
                (now - resourceInfo.lastAccessed) > this.maxResourceAge) {
                resourcesToRelease.push(id);
            }
        }
        
        if (resourcesToRelease.length > 0) {
            console.log(`清理 ${resourcesToRelease.length} 个过期资源`);
            this.releaseResources(resourcesToRelease);
        }
    }

    /**
     * 强制清理所有资源
     */
    forceCleanupAll() {
        const allResourceIds = Array.from(this.resources.keys());
        this.releaseResources(allResourceIds);
        this.resources.clear();
    }

    /**
     * 获取资源统计信息
     * @returns {Object} 统计信息
     */
    getResourceStats() {
        const stats = {
            total: this.resources.size,
            released: 0,
            byType: {},
            expired: 0
        };
        
        const now = Date.now();
        
        for (const resourceInfo of this.resources.values()) {
            if (resourceInfo.isReleased) {
                stats.released++;
            } else {
                // 按类型统计
                if (!stats.byType[resourceInfo.type]) {
                    stats.byType[resourceInfo.type] = 0;
                }
                stats.byType[resourceInfo.type]++;
                
                // 统计过期资源
                if ((now - resourceInfo.lastAccessed) > this.maxResourceAge) {
                    stats.expired++;
                }
            }
        }
        
        return stats;
    }

    /**
     * 添加清理任务
     * @param {Function} cleanupTask - 清理任务函数
     * @param {string} taskId - 任务ID
     */
    addCleanupTask(cleanupTask, taskId) {
        this.cleanupTasks.set(taskId, {
            task: cleanupTask,
            createdAt: Date.now()
        });
    }

    /**
     * 执行清理任务
     * @param {string} taskId - 任务ID
     */
    executeCleanupTask(taskId) {
        const cleanupInfo = this.cleanupTasks.get(taskId);
        if (cleanupInfo) {
            try {
                cleanupInfo.task();
                this.cleanupTasks.delete(taskId);
                return true;
            } catch (error) {
                console.error(`执行清理任务 ${taskId} 时出错:`, error);
                return false;
            }
        }
        return false;
    }

    /**
     * 执行所有清理任务
     */
    executeAllCleanupTasks() {
        const taskIds = Array.from(this.cleanupTasks.keys());
        taskIds.forEach(id => this.executeCleanupTask(id));
    }
}

// 全局资源管理器实例
const globalResourceManager = new ResourceManager();

// 便捷工具函数
/**
 * 创建并管理Blob URL
 * @param {Blob} blob - Blob对象
 * @param {Object} metadata - 元数据
 * @returns {string} 资源ID
 */
function createManagedBlobUrl(blob, metadata = {}) {
    const url = URL.createObjectURL(blob);
    const resourceId = globalResourceManager.registerResource(
        url,
        ResourceType.URL,
        { ...metadata, blobSize: blob.size }
    );
    
    return { url, resourceId };
}

/**
 * 创建并管理FileReader
 * @param {Object} metadata - 元数据
 * @returns {Object} { reader, resourceId }
 */
function createManagedFileReader(metadata = {}) {
    const reader = new FileReader();
    const resourceId = globalResourceManager.registerResource(
        reader,
        ResourceType.FILE_READER,
        metadata
    );
    
    return { reader, resourceId };
}

/**
 * 创建并管理Canvas
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {Object} metadata - 元数据
 * @returns {Object} { canvas, resourceId }
 */
function createManagedCanvas(width, height, metadata = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const resourceId = globalResourceManager.registerResource(
        canvas,
        ResourceType.CANVAS,
        { ...metadata, width, height }
    );
    
    return { canvas, resourceId };
}

/**
 * 创建并管理Image对象
 * @param {Object} metadata - 元数据
 * @returns {Object} { image, resourceId }
 */
function createManagedImage(metadata = {}) {
    const image = new Image();
    const resourceId = globalResourceManager.registerResource(
        image,
        ResourceType.IMAGE,
        metadata
    );
    
    return { image, resourceId };
}

/**
 * 创建并管理定时器
 * @param {Function} callback - 回调函数
 * @param {number} delay - 延迟时间
 * @param {Object} metadata - 元数据
 * @returns {Object} { timerId, resourceId }
 */
function createManagedTimer(callback, delay, metadata = {}) {
    const timerId = setTimeout(() => {
        callback();
        globalResourceManager.releaseResource(resourceId);
    }, delay);
    
    const resourceId = globalResourceManager.registerResource(
        timerId,
        ResourceType.TIMER,
        { ...metadata, delay }
    );
    
    return { timerId, resourceId };
}

/**
 * 创建并管理事件监听器
 * @param {EventTarget} target - 事件目标
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理器
 * @param {Object} options - 事件选项
 * @param {Object} metadata - 元数据
 * @returns {string} 资源ID
 */
function createManagedEventListener(target, event, handler, options = {}, metadata = {}) {
    target.addEventListener(event, handler, options);
    
    const resourceId = globalResourceManager.registerResource(
        handler,
        ResourceType.EVENT_LISTENER,
        { target, event, handler, options, ...metadata }
    );
    
    return resourceId;
}

/**
 * 释放资源（便捷函数）
 * @param {string} resourceId - 资源ID
 */
function releaseResource(resourceId) {
    return globalResourceManager.releaseResource(resourceId);
}

/**
 * 获取资源管理器实例
 * @returns {ResourceManager} 资源管理器
 */
function getResourceManager() {
    return globalResourceManager;
}

// 页面卸载时清理所有资源
window.addEventListener('beforeunload', () => {
    globalResourceManager.forceCleanupAll();
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ResourceManager,
        ResourceType,
        createManagedBlobUrl,
        createManagedFileReader,
        createManagedCanvas,
        createManagedImage,
        createManagedTimer,
        createManagedEventListener,
        releaseResource,
        getResourceManager,
        globalResourceManager
    };
} else {
    window.ResourceManager = {
        ResourceManager,
        ResourceType,
        createManagedBlobUrl,
        createManagedFileReader,
        createManagedCanvas,
        createManagedImage,
        createManagedTimer,
        createManagedEventListener,
        releaseResource,
        getResourceManager,
        globalResourceManager
    };
}