chrome.tabs.onActivated.addListener(function callback(activeInfo) {
	// alert("onActivated:\n tabId：" + activeInfo.tabId + "\n" + "windowId：" + activeInfo.windowId);
	chrome.tabs.get(activeInfo.tabId, function callback(tab) {
		alert(tab.url);
	});
});

chrome.tabs.onUpdated.addListener(function callback(tabId, changeInfo, tab) {
	if (changeInfo.url != undefined && tab.active) {
		alert(changeInfo.url);
	}
});

chrome.tabs.onRemoved.addListener(function callback(tabId, removeInfo) {
	alert(tabId + "关闭了");
});