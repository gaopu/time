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

        var str = "";
        for (var i = 0; i < localStorage.length; i++) {
            str += localStorage.key(i) + " -> " + localStorage.getItem(localStorage.key(i)) + "\n";
        }
        document.getElementById("status").innerText = str;
    });
}

window.addEventListener("load", updatePage, false);
