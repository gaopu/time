// 存储所有打开的window的id
var windowsArr = [];
init();
// 第一次使用插件时，初始化一些参数
function init() {
    // 第一次使用插件
    if (localStorage["today"] == null) {
        localStorage["today"] = new Date().toLocaleDateString();
    }

    // "today"属性不是今天的日期
    // 即每日第一次使用插件时，设置每个网站的"today"属性为"0"
    if (localStorage["today"] != new Date().toLocaleDateString()) {
        setTodayZero();
    }

    chrome.windows.getAll(function(windows) {
        for (var i = 0; i < windows.length; i++) {
            var windowId = windows[i].id;

            windowsArr = windowsArr.concat(windowId);
        }
    });

    // 存储版本号
    var manifest = chrome.runtime.getManifest();
    localStorage["version"] = manifest.version;
}

// 设置定时器，在第二天凌晨零点触发
chrome.alarms.create("newDay", { when: new Date(new Date().toLocaleDateString()).getTime() + 86400000 });
// alarm处理程序
chrome.alarms.onAlarm.addListener(function(alarm) {
    // 这里把时间统计一下并存储
    // 表示这是由于新的一天到了而触发
    if (alarm.name == "newDay") {
        // 凌晨零点，获取所有window，将这些窗口的计时状态都存储、更新
        chrome.windows.getAll(function(windows) {
            for (var i = 0; i < windows.length; i++) {
                var windowId = windows[i].id;

                if (localStorage[windowId] == null) {
                    continue;
                }

                saveTime(windowId);
            }

            setTodayZero();
            localStorage["today"] = new Date().toLocaleDateString();
            chrome.alarms.create("newDay", { when: new Date(new Date().toLocaleDateString()).getTime() + 86400000 });
        });
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
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

        // 进入Chrome的内置页面，就不用计时了，停止计时状态
        if (url.substring(0, 9) === "chrome://" || url.substring(0, 19) === "chrome-extension://" || url.substring(0, 7) === "file://") {
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
chrome.windows.onRemoved.addListener(function(windowId) {
    saveTime(windowId);
    localStorage.removeItem(windowId);

    for (var i = 0; i < windowsArr.length; i++) {
        if (windowsArr[i] == windowId) {
            // 移除windowId
            windowsArr.splice(i, 1);
        }
    }
});

// 当tab更新时提醒，检测是否url改变了，改变了就存储上一个网站的计时
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // 这个tab并不是最前端，就不作处理
    if (!tab.active) {
        return;
    }

    // url改变了
    if (changeInfo.url != null) {
        if (changeInfo.url.substring(0, 9) === "chrome://" || changeInfo.url.substring(0, 19) === "chrome-extension://" || changeInfo.url.substring(0, 7) === "file://") {
            return;
        }

        saveTime(tab.windowId);
        startTimer(tab.windowId, tabId, changeInfo.url);
    }
});

// 开始计时
function startTimer(windowId, tabId, url) {
    var domain = extractDomain(url);
    // 此处同时处理了"多个window同时计时同一个网站"的情况
    // 计时开始时：保存一个相同网站的时间，然后将所有同一网站的计时start设置为同一时间
    chrome.windows.getAll(function(windows) {
        // 保存一个相同网站的时间
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
            windowsArr = windowsArr.concat(windowId);
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
        // 计时结束时：保存一个相同的网站的时间，修改所有相同的网站的start为同一时间

        // 保存一个相同网站的时间
        for (var i = 0; i < windowsArr.length; i++) {
            var wId = windowsArr[i];

            if (localStorage[wId] == null) {
                continue;
            }

            if (JSON.parse(localStorage[wId]).domain == domain) {
                var jsonStr = getSaveJsonStr(jsonObj.domain, jsonObj.start);

                if (jsonStr != null) {
                    localStorage[jsonObj.domain] = jsonStr;
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
function getStartTimeInfoJsonStr(tabId, domain, start = Date.now()) {
    return '{"tabId":' + tabId + ',"domain":"' + domain + '","start":' + start + '}';
}

// 返回根据url求出的域名
function extractDomain(url) {
    var re = /:\/\/(www\.)?(.+?)\//;
    return url.match(re)[2];
}
