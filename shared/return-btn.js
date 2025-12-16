// 创建返回按钮 - 统一版本
function createReturnButton() {
    const returnBtn = document.createElement('button');
    returnBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>返回工具箱</span>
    `;
    returnBtn.className = 'return-button';
    
    // 内联样式，确保在所有页面中都能正确显示
    returnBtn.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 6px;
        background: #8b5cf6;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: var(--shadow-md);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    // 添加悬停效果
    returnBtn.addEventListener('mouseenter', () => {
        returnBtn.style.boxShadow = 'var(--shadow-lg)';
        returnBtn.style.transform = 'translateY(-2px)';
    });
    
    returnBtn.addEventListener('mouseleave', () => {
        returnBtn.style.boxShadow = 'var(--shadow-md)';
        returnBtn.style.transform = 'translateY(0)';
    });
    
    returnBtn.addEventListener('click', () => {
        console.log('Return button clicked');
        window.open('../index.html', '_self');
    });
    
    return returnBtn;
}

// 等待页面加载完成后添加返回按钮
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, adding return button');
    // 添加返回按钮到页面
    document.body.appendChild(createReturnButton());
});