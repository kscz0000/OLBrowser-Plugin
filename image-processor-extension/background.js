// 点击插件图标时在新标签页打开选择界面
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: 'index.html' });
});