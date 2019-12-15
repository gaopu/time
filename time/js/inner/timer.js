// 开始计时
function startTimer(windowId, tabId, url) {
    // 某些页面不需要计时，在此处过滤
    if (filterUrl(url)) {
        localStorage.removeItem(windowId);
        return;
    }

    var domain = extractDomain(url);
    // 此处同时处理了"多个window同时计时同一个网站"的情况
    // 计时开始时：保存一个相同网站的时间，再将所有与此相同的网站的start设置为同一时间
    chrome.windows.getAll(function (windows) {
        // 当一个网页在多个窗口中打开时，只计算其中一个的时间并保存
        for (var i = 0; i < windows.length; i++) {
            var wId = windows[i].id;

            if (localStorage[wId] == null) {
                continue;
            }

            if (JSON.parse(localStorage[wId]).domain == domain) {
                saveTime(wId);
                break;
            }
        }
        // 将所有同一网站的计时start设置为同一时间
        var start = Date.now();
        for (var i = 0; i < windows.length; i++) {
            var wId = windows[i].id;

            if (localStorage[wId] == null) {
                continue;
            }

            var obj = JSON.parse(localStorage[wId]);
            if (obj.domain == domain) {
                localStorage[wId] = getStartTimeInfoJsonStr(obj.tabId, domain, start);
            }
        }

        localStorage[windowId] = getStartTimeInfoJsonStr(tabId, domain, start);

        // 标记windowsArr数组中是否存储了当前的windowId
        var have = false;
        for (var i = 0; i < windowsArr.length; i++) {
            if (windowsArr[i] == windowId) {
                have = true;
            }
        }

        if (!have) {
            windowsArr.push(windowId);
        }
    });
}

// 存储网站的访问时间
function saveTime(windowId) {
    // 这个window有计时信息
    if (localStorage[windowId] != null) {
        var jsonObj = JSON.parse(localStorage[windowId]);
        var domain = jsonObj.domain;

        // 此处同时处理了"多个window同时计时同一个网站"的情况
        // 计时结束时：保存一个相同的网站的时间，再修改所有与此相同的网站的start为同一时间

        // 保存一个相同网站的时间
        for (var i = 0; i < windowsArr.length; i++) {
            var wId = windowsArr[i];

            if (localStorage[wId] == null) {
                continue;
            }

            if (JSON.parse(localStorage[wId]).domain == domain) {
                var info = getSaveJsonStr(jsonObj.domain, jsonObj.start);

                if (info != null) {
                    localStorage[jsonObj.domain] = JSON.stringify({
                        today: info.today,
                        all: info.all
                    });

                    allStore({
                        site: info.site,
                        all: info.all
                    });

                    historyStore({
                        site: info.site,
                        date: info.date,
                        duration: info.today
                    });
                }
                break;
            }
        }
        // 将所有同一网站的计时start设置为同一时间
        var start = Date.now();
        for (var i = 0; i < windowsArr.length; i++) {
            var wId = windowsArr[i];

            if (localStorage[wId] == null) {
                continue;
            }

            var obj = JSON.parse(localStorage[wId]);
            if (obj.domain == domain) {
                localStorage[wId] = getStartTimeInfoJsonStr(obj.tabId, domain, start);
            }
        }
    }
}