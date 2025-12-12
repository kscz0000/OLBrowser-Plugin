// 创建返回按钮 - 统一版本
function createReturnButton() {
    const returnBtn = document.createElement('button');
    returnBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        gap: 8px;
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 12px 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    // 添加悬停效果
    returnBtn.addEventListener('mouseenter', () => {
        returnBtn.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
        returnBtn.style.transform = 'translateY(-2px)';
    });
    
    returnBtn.addEventListener('mouseleave', () => {
        returnBtn.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
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