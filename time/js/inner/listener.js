// 日切监听器
chrome.alarms.create("newDay", { when: new Date(getDateString()).getTime() + 86400000 });
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name == "newDay") {
        // 凌晨零点，获取所有window，将这些窗口的计时状态都存储、更新
        chrome.windows.getAll(function (windows) {
            for (var i = 0; i < windows.length; i++) {
                var windowId = windows[i].id;

                if (localStorage[windowId] == null) {
                    continue;
                }

                saveTime(windowId);
            }

            setTodayZero();
            setTodayDate();
            chrome.alarms.create("newDay", { when: new Date(getDateString()).getTime() + 86400000 });
        });
    }
});


// tab激活监听器
chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        var url = tab.url;

        if (url == "" || url == null) {
            return;
        }

        var tabId = activeInfo.tabId;
        var windowId = activeInfo.windowId;

        // 激活了一个新的tab，就要把上一个tab的网站计时并保存
        if (localStorage[windowId] != null) {
            saveTime(windowId);
        }

        // 记录新的计时状态
        startTimer(windowId, tabId, url);
    });
});


// tab关闭监听器
chrome.windows.onRemoved.addListener(function (windowId) {
    saveTime(windowId);
    localStorage.removeItem(windowId);

    for (var i = 0; i < windowsArr.length; i++) {
        if (windowsArr[i] == windowId) {
            // 移除windowId
            windowsArr.splice(i, 1);
        }
    }
});


// tab更新监听器
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // 这个tab并不是最前端，就不作处理
    if (!tab.active) {
        return;
    }

    // url改变了
    if (changeInfo.url != null) {
        saveTime(tab.windowId);
        if (changeInfo.url.substring(0, 9) === "chrome://" || changeInfo.url.substring(0, 19) === "chrome-extension://" || changeInfo.url.substring(0, 7) === "file://") {
            localStorage.removeItem(tab.windowId);
            return;
        }

        startTimer(tab.windowId, tabId, changeInfo.url);
    }
});