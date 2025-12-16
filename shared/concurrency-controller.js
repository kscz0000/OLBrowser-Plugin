/**
 * 并发控制模块
 * 用于管理并发任务执行，防止资源竞争和系统过载
 * 创建时间：2025-12-15
 */

// 任务状态枚举
const TaskStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

// 任务优先级枚举
const TaskPriority = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

// 并发控制器类
class ConcurrencyController {
    constructor(options = {}) {
        this.maxConcurrency = options.maxConcurrency || 3; // 最大并发数
        this.maxQueueSize = options.maxQueueSize || 100; // 最大队列大小
        this.timeout = options.timeout || 60000; // 默认超时时间（60秒）
        
        this.taskQueue = []; // 任务队列
        this.runningTasks = new Map(); // 正在运行的任务
        this.completedTasks = new Map(); // 已完成的任务
        this.taskIdCounter = 0; // 任务ID计数器
        this.stats = {
            total: 0,
            completed: 0,
            failed: 0,
            cancelled: 0,
            averageExecutionTime: 0
        }; // 统计信息
        
        // 性能监控
        this.performanceMetrics = {
            cpuUsage: 0,
            memoryUsage: 0,
            lastCheckTime: Date.now()
        };
    }

    /**
     * 添加任务到队列
     * @param {Function} taskFunction - 任务函数
     * @param {Object} options - 任务选项
     * @returns {Promise} 任务结果Promise
     */
    async addTask(taskFunction, options = {}) {
        // 检查队列大小
        if (this.taskQueue.length >= this.maxQueueSize) {
            throw new Error(`任务队列已满，最大容量: ${this.maxQueueSize}`);
        }

        const taskId = `task_${++this.taskIdCounter}`;
        const task = {
            id: taskId,
            function: taskFunction,
            status: TaskStatus.PENDING,
            priority: options.priority || TaskPriority.NORMAL,
            createdAt: Date.now(),
            timeout: options.timeout || this.timeout,
            retryCount: 0,
            maxRetries: options.maxRetries || 2,
            metadata: options.metadata || {}
        };

        // 根据优先级插入队列
        this.insertTaskByPriority(task);
        this.stats.total++;
        
        // 尝试执行任务
        this.processNextTasks();
        
        return new Promise((resolve, reject) => {
            task.resolve = resolve;
            task.reject = reject;
        });
    }

    /**
     * 根据优先级插入任务
     * @param {Object} task - 任务对象
     */
    insertTaskByPriority(task) {
        let insertIndex = this.taskQueue.length;
        
        for (let i = 0; i < this.taskQueue.length; i++) {
            if (this.taskQueue[i].priority < task.priority) {
                insertIndex = i;
                break;
            }
        }
        
        this.taskQueue.splice(insertIndex, 0, task);
    }

    /**
     * 处理下一个任务
     */
    async processNextTasks() {
        // 检查是否可以处理更多任务
        while (this.runningTasks.size < this.maxConcurrency && this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
            await this.executeTask(task);
        }
    }

    /**
     * 执行单个任务
     * @param {Object} task - 任务对象
     */
    async executeTask(task) {
        task.status = TaskStatus.RUNNING;
        task.startedAt = Date.now();
        this.runningTasks.set(task.id, task);
        
        try {
            // 设置超时
            const timeoutPromise = new Promise((_, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error(`任务超时: ${task.timeout}ms`));
                }, task.timeout);
                task.timeoutId = timeoutId;
            });
            
            // 执行任务
            const taskPromise = Promise.resolve(task.function());
            
            // 等待任务完成或超时
            const result = await Promise.race([taskPromise, timeoutPromise]);
            
            // 清除超时
            if (task.timeoutId) {
                clearTimeout(task.timeoutId);
            }
            
            // 任务成功
            this.completeTask(task, result);
            task.resolve(result);
            
        } catch (error) {
            // 任务失败，检查是否需要重试
            if (task.retryCount < task.maxRetries) {
                task.retryCount++;
                task.status = TaskStatus.PENDING;
                this.runningTasks.delete(task.id);
                
                // 重新加入队列，优先级稍低
                task.priority = Math.max(TaskPriority.LOW, task.priority - 1);
                this.insertTaskByPriority(task);
                
                // 延迟重试
                setTimeout(() => this.processNextTasks(), 1000 * task.retryCount);
            } else {
                // 最终失败
                this.failTask(task, error);
                task.reject(error);
            }
        }
    }

    /**
     * 完成任务
     * @param {Object} task - 任务对象
     * @param {any} result - 任务结果
     */
    completeTask(task, result) {
        task.status = TaskStatus.COMPLETED;
        task.completedAt = Date.now();
        task.executionTime = task.completedAt - task.startedAt;
        task.result = result;
        
        this.runningTasks.delete(task.id);
        this.completedTasks.set(task.id, task);
        this.stats.completed++;
        this.updateAverageExecutionTime(task.executionTime);
        
        // 继续处理队列
        this.processNextTasks();
    }

    /**
     * 任务失败
     * @param {Object} task - 任务对象
     * @param {Error} error - 错误信息
     */
    failTask(task, error) {
        task.status = TaskStatus.FAILED;
        task.completedAt = Date.now();
        task.executionTime = task.completedAt - task.startedAt;
        task.error = error;
        
        this.runningTasks.delete(task.id);
        this.completedTasks.set(task.id, task);
        this.stats.failed++;
        
        // 继续处理队列
        this.processNextTasks();
    }

    /**
     * 取消任务
     * @param {string} taskId - 任务ID
     * @returns {boolean} 是否成功取消
     */
    cancelTask(taskId) {
        // 检查正在运行的任务
        const runningTask = this.runningTasks.get(taskId);
        if (runningTask) {
            runningTask.status = TaskStatus.CANCELLED;
            if (runningTask.timeoutId) {
                clearTimeout(runningTask.timeoutId);
            }
            this.runningTasks.delete(taskId);
            this.completedTasks.set(taskId, runningTask);
            this.stats.cancelled++;
            
            // 通知任务被取消
            runningTask.reject(new Error('任务被取消'));
            return true;
        }
        
        // 检查队列中的任务
        const queueIndex = this.taskQueue.findIndex(t => t.id === taskId);
        if (queueIndex !== -1) {
            const task = this.taskQueue.splice(queueIndex, 1)[0];
            task.status = TaskStatus.CANCELLED;
            this.completedTasks.set(taskId, task);
            this.stats.cancelled++;
            
            // 通知任务被取消
            task.reject(new Error('任务被取消'));
            return true;
        }
        
        return false;
    }

    /**
     * 取消所有任务
     */
    cancelAllTasks() {
        // 取消正在运行的任务
        for (const [taskId, task] of this.runningTasks) {
            task.status = TaskStatus.CANCELLED;
            if (task.timeoutId) {
                clearTimeout(task.timeoutId);
            }
            task.reject(new Error('任务被取消'));
            this.completedTasks.set(taskId, task);
            this.stats.cancelled++;
        }
        this.runningTasks.clear();
        
        // 取消队列中的任务
        for (const task of this.taskQueue) {
            task.status = TaskStatus.CANCELLED;
            task.reject(new Error('任务被取消'));
            this.completedTasks.set(task.id, task);
            this.stats.cancelled++;
        }
        this.taskQueue.length = 0;
    }

    /**
     * 更新平均执行时间
     * @param {number} executionTime - 执行时间
     */
    updateAverageExecutionTime(executionTime) {
        const completedCount = this.stats.completed;
        if (completedCount === 1) {
            this.stats.averageExecutionTime = executionTime;
        } else {
            this.stats.averageExecutionTime = 
                (this.stats.averageExecutionTime * (completedCount - 1) + executionTime) / completedCount;
        }
    }

    /**
     * 获取队列状态
     * @returns {Object} 队列状态信息
     */
    getQueueStatus() {
        return {
            queueLength: this.taskQueue.length,
            runningTasks: this.runningTasks.size,
            maxConcurrency: this.maxConcurrency,
            utilization: (this.runningTasks.size / this.maxConcurrency * 100).toFixed(1) + '%',
            stats: { ...this.stats }
        };
    }

    /**
     * 获取任务详情
     * @param {string} taskId - 任务ID
     * @returns {Object|null} 任务详情
     */
    getTaskDetails(taskId) {
        const runningTask = this.runningTasks.get(taskId);
        if (runningTask) {
            return runningTask;
        }
        
        const completedTask = this.completedTasks.get(taskId);
        if (completedTask) {
            return completedTask;
        }
        
        const queuedTask = this.taskQueue.find(t => t.id === taskId);
        if (queuedTask) {
            return queuedTask;
        }
        
        return null;
    }

    /**
     * 清理已完成的任务
     * @param {number} maxAge - 最大保留时间（毫秒）
     */
    cleanupCompletedTasks(maxAge = 10 * 60 * 1000) { // 默认10分钟
        const now = Date.now();
        const tasksToRemove = [];
        
        for (const [taskId, task] of this.completedTasks) {
            if ((now - task.completedAt) > maxAge) {
                tasksToRemove.push(taskId);
            }
        }
        
        tasksToRemove.forEach(taskId => this.completedTasks.delete(taskId));
        
        if (tasksToRemove.length > 0) {
            console.log(`清理了 ${tasksToRemove.length} 个已完成的任务`);
        }
    }

    /**
     * 调整最大并发数
     * @param {number} newMaxConcurrency - 新的最大并发数
     */
    adjustMaxConcurrency(newMaxConcurrency) {
        const oldMaxConcurrency = this.maxConcurrency;
        this.maxConcurrency = Math.max(1, newMaxConcurrency);
        
        // 如果增加了并发数，尝试处理更多任务
        if (this.maxConcurrency > oldMaxConcurrency) {
            this.processNextTasks();
        }
    }

    /**
     * 获取性能指标
     * @returns {Object} 性能指标
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            queueStatus: this.getQueueStatus(),
            taskDistribution: this.getTaskDistribution()
        };
    }

    /**
     * 获取任务分布
     * @returns {Object} 任务分布统计
     */
    getTaskDistribution() {
        const distribution = {
            pending: this.taskQueue.length,
            running: this.runningTasks.size,
            completed: this.stats.completed,
            failed: this.stats.failed,
            cancelled: this.stats.cancelled
        };
        
        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        
        return {
            ...distribution,
            percentages: {
                pending: (distribution.pending / total * 100).toFixed(1),
                running: (distribution.running / total * 100).toFixed(1),
                completed: (distribution.completed / total * 100).toFixed(1),
                failed: (distribution.failed / total * 100).toFixed(1),
                cancelled: (distribution.cancelled / total * 100).toFixed(1)
            }
        };
    }
}

// 创建全局并发控制器实例
const globalConcurrencyController = new ConcurrencyController({
    maxConcurrency: 3,
    maxQueueSize: 100,
    timeout: 60000
});

// 便捷函数
/**
 * 添加任务到全局队列
 * @param {Function} taskFunction - 任务函数
 * @param {Object} options - 任务选项
 * @returns {Promise} 任务结果Promise
 */
function addTask(taskFunction, options = {}) {
    return globalConcurrencyController.addTask(taskFunction, options);
}

/**
 * 取消任务
 * @param {string} taskId - 任务ID
 * @returns {boolean} 是否成功取消
 */
function cancelTask(taskId) {
    return globalConcurrencyController.cancelTask(taskId);
}

/**
 * 获取队列状态
 * @returns {Object} 队列状态信息
 */
function getQueueStatus() {
    return globalConcurrencyController.getQueueStatus();
}

/**
 * 获取并发控制器实例
 * @returns {ConcurrencyController} 并发控制器
 */
function getConcurrencyController() {
    return globalConcurrencyController;
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    globalConcurrencyController.cancelAllTasks();
});

// 定期清理已完成任务
setInterval(() => {
    globalConcurrencyController.cleanupCompletedTasks();
}, 5 * 60 * 1000); // 每5分钟清理一次

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ConcurrencyController,
        TaskStatus,
        TaskPriority,
        addTask,
        cancelTask,
        getQueueStatus,
        getConcurrencyController,
        globalConcurrencyController
    };
} else {
    window.ConcurrencyController = {
        ConcurrencyController,
        TaskStatus,
        TaskPriority,
        addTask,
        cancelTask,
        getQueueStatus,
        getConcurrencyController,
        globalConcurrencyController
    };
}