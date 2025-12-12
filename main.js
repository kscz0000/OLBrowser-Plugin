// 打开图像压缩工具
function openImageCompressor() {
    console.log('Opening image compressor');
    window.open('./image-compressor/index.html', '_blank');
    window.close(); // 打开新窗口后关闭当前窗口
}

// 打开SVG转图片工具
function openSvgConverter() {
    console.log('Opening SVG converter');
    window.open('./svg-converter/index.html', '_blank');
    window.close(); // 打开新窗口后关闭当前窗口
}

// 页面加载完成后设置事件监听器
document.addEventListener('DOMContentLoaded', function() {
    console.log('Main page loaded, setting up event listeners');
    // 为图像压缩按钮添加点击事件
    const compressorBtn = document.getElementById('openImageCompressor');
    if (compressorBtn) {
        compressorBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡，避免同时触发卡片点击事件
            openImageCompressor();
        });
    }
    
    // 为SVG转换器按钮添加点击事件
    const converterBtn = document.getElementById('openSvgConverter');
    if (converterBtn) {
        converterBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡，避免同时触发卡片点击事件
            openSvgConverter();
        });
    }
    
    // 为卡片添加点击事件
    const compressorCard = document.getElementById('compressor-card');
    if (compressorCard) {
        compressorCard.addEventListener('click', openImageCompressor);
    }
    
    const converterCard = document.getElementById('converter-card');
    if (converterCard) {
        converterCard.addEventListener('click', openSvgConverter);
    }
    
    // 为关闭窗口按钮添加点击事件
    const closeBtn = document.getElementById('close-window');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            window.close();
        });
    }
});