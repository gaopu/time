init();
// 第一次使用插件时，初始化一些参数
function init() {
    // 第一次使用插件
    if (localStorage["today"] == null) {
        localStorage["today"] = new Date().toLocaleDateString();
    }
}

// 设置定时器，在第二天凌晨零点触发
chrome.alarms.create("newDay", { when: new Date(new Date().toLocaleDateString()).getTime() + 86400000 });
// alarm处理程序
chrome.alarms.onAlarm.addListener(function callback(alarm) {
    // 这里把时间统计一下并存储
    // 表示这是由于新的一天到了而触发
    if (alarm.name == "newDay") {
    	alert("到了新的一天！");
        // 凌晨零点，获取所有window，将这些窗口的计时状态都存储、更新
        chrome.windows.getAll(function callback(windows) {
            for (var i = 0; i < windows.length; i++) {
                var windowId = windows[i].id;

                if (localStorage[windowId] == null) {
                    continue;
                }

                saveTime(windowId);

                // 更新start时间到现在
                var jsonObj = JSON.parse(localStorage[windowId]);
                localStorage[windowId] = getStartTimeInfoJsonStr(jsonObj.tabId, jsonObj.domain);
            }

            setTodayZero();
            localStorage["today"] = new Date().toLocaleString();
            chrome.alarms.create("newDay", { when: new Date(new Date().toLocaleDateString()).getTime() + 86400000 });
        });
    }
});

chrome.tabs.onActivated.addListener(function callback(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function callback(tab) {
        var url = tab.url;
        var tabId = activeInfo.tabId;
        var windowId = activeInfo.windowId;

        // 激活了一个新的tab，就要把上一个tab的网站计时并保存
        if (localStorage[windowId] != null) {
            saveTime(windowId);
        }

        // 进入Chrome的内置页面，就不用计时了，停止计时状态
        if (url.substring(0, 9) === "chrome://" || url.substring(0, 19) === "chrome-extension://") {
            localStorage.removeItem(windowId);
            return;
        }

        // 记录新的计时状态
        startTimer(windowId, tabId, url);

        // "today"属性不是今天的日期
        if (localStorage["today"] != new Date().toLocaleDateString()) {
            setTodayZero();
        }
    });
});

// window关闭时，结束并保存那个window的网站计时
chrome.windows.onRemoved.addListener(function callback(windowId) {
    saveTime(windowId);
    localStorage.removeItem(windowId);
    更新windows信息
});

// 当tab更新时提醒，检测是否url改变了，改变了就存储上一个网站的计时
chrome.tabs.onUpdated.addListener(function callback(tabId, changeInfo, tab) {
    // 这个tab并不是最前端，就不作处理
    if (!tab.active) {
        return;
    }

    // url改变了
    if (changeInfo.url != null) {
        if (changeInfo.url.substring(0, 9) === "chrome://" || changeInfo.url.substring(0, 19) === "chrome-extension://") {
            return;
        }

        saveTime(tab.windowId);
        startTimer(tab.windowId, tabId, changeInfo.url);
    }
});

// 开始计时
function startTimer(windowId, tabId, url) {
    localStorage[windowId] = getStartTimeInfoJsonStr(tabId, extractDomain(url));
}

// 存储网站的访问时间
function saveTime(windowId) {
    // 这个window有计时信息
    if (localStorage[windowId] != null) {
        var jsonObj = JSON.parse(localStorage[windowId]);
        var jsonStr = getSaveJsonStr(jsonObj.domain, jsonObj.start);

        if (jsonStr != null) {
            localStorage[jsonObj.domain] = jsonStr;
        }
    }
}

// 构造记录网站访问时间的json串，json串中的内容有：
// all 总共的访问时间
// today 当日访问时间
// 时间单位是秒
function getSaveJsonStr(domain, start) {
    var jsonStr = localStorage[domain];
    var today, all;

    // 本次的访问时间
    var time = parseInt((Date.now() - start) / 1000);

    if (time <= 0) {
        return null;
    }

    // 先前并没有给这个网站记过访问时间
    if (jsonStr == null) {
        all = today = time;
        var domains = localStorage["domains"];
        if (domains == null) {
            domains = domain;
        } else {
            domains = domains + ',' + domain;
        }

        localStorage["domains"] = domains;
    } else {
        var jsonObj = JSON.parse(jsonStr);
        today = jsonObj.today + time;
        all = jsonObj.all + time;
    }

    return '{"today":' + today + ',"all":' + all + '}';
}

// 每日第一次访问插件时，更新所有网站的访问时间，即将每个网站的今日访问时间"today"更新为0,。
function setTodayZero() {
    localStorage["today"] = new Date().toLocaleDateString();

    var domainsStr = localStorage["domains"];
    if (domainsStr != null) {
        var domainsArr = domainsStr.split(",");
        for (var i = 0; i < domainsArr.length; i++) {
            var domain = domainsArr[i];
            var domainTimeJsonObj = JSON.parse(localStorage[domain]);
            var allTime = domainTimeJsonObj.all;

            localStorage[domain] = '{"today":0,"all":' + allTime + '}';
        }
    }
}

// 构造计时信息的json串，json串中的内容有：
// tabId 某个在window最前端的tab的Id
// domain 这个tab的网站域名
// start 开始计时的时间戳，13位
function getStartTimeInfoJsonStr(tabId, domain) {
    return '{"tabId":' + tabId + ',"domain":"' + domain + '","start":' + Date.now() + '}';
}

// 返回根据url求出的域名
function extractDomain(url) {
    var re = /:\/\/(www\.)?(.+?)\//;
    return url.match(re)[2];
}
