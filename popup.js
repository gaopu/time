var bg = chrome.extension.getBackgroundPage();

function updatePage() {
    //点击插件时，全部激活tab的访问时间都更新
    chrome.windows.getAll(function callback(windows) {
        for (var i = 0; i < windows.length; i++) {
            var windowId = windows[i].id;

            if (localStorage[windowId] == null) {
                continue;
            }

            bg.saveTime(windowId);

            // 更新start时间到现在
            var jsonObj = JSON.parse(localStorage[windowId]);
            localStorage[windowId] = bg.getStartTimeInfoJsonStr(jsonObj.tabId, jsonObj.domain);
        }

        document.getElementById("status").innerText = localStorage["zhihu.com"];
    });
}

window.addEventListener("load", updatePage, false);
