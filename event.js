// 存储所有打开的window的id
// 不使用chrome.windows.getAll获取所有窗口id是因为那个方法是异步调用的，在一些地方需要及时处理，所以不能用异步调用的方法去处理
var windowsArr = [];

init();
// 每日第一次使用插件时，初始化
function init() {
    // 第一次安装后使用插件
    if (localStorage["today"] == null) {
        setTodayDate();

        // 插件默认显示前10个网站的访问时间
        localStorage["show"] = 10;
    }

    // 存储版本号
    var manifest = chrome.runtime.getManifest();
    localStorage["version"] = manifest.version;

    // 如果"today"属性不是今天的日期时：设置每个网站的"today"属性为"0"
    if (localStorage["today"] != getDateString()) {
        setTodayZero();
        setTodayDate();
    }

    //有时候窗口计时信息会删除不干净，所以用此方法来删除：遍历所有存储的数据，删除key是纯数字的数据
    var numRegex = /^\d+$/;
    var willDeleteKeyArr = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (numRegex.test(key)) {
            willDeleteKeyArr.push(key);
        }
    }

    willDeleteKeyArr.forEach(function (key) {
        localStorage.removeItem(key);
    });

    // 填充windowsArr数组
    chrome.windows.getAll(function (windows) {
        for (var i = 0; i < windows.length; i++) {
            var windowId = windows[i].id;
            windowsArr.push(windowId);
        }
    });
}

// 设置定时器，在第二天凌晨零点触发
chrome.alarms.create("newDay", { when: new Date(getDateString()).getTime() + 86400000 });
// alarm处理程序
chrome.alarms.onAlarm.addListener(function (alarm) {
    // 这里把时间统计一下并存储
    // 表示这是由于新的一天到了而触发
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

// window关闭时，结束并保存那个window的网站计时
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

// 当tab更新时提醒，检测是否url改变了，改变了就存储上一个网站的计时
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // 这个tab并不是最前端，就不作处理
    if (!tab.active) {
        return;
    }

    // url改变了
    if (changeInfo.url != null) {
        saveTime(tab.windowId);
        startTimer(tab.windowId, tabId, changeInfo.url);
    }
});

// 开始计时
function startTimer(windowId, tabId, url) {
    //某些页面不需要计时，在此处过滤
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
        var start = jsonObj.start;

        // 因为每10秒会自动保存一次浏览时间，所以一旦本次计时时间超过10s很多，那么就认为这次计时无效
        var now = Date.now();
        if (parseInt((now - start) / 1000) > 20) {
            jsonObj.start = now;
        }

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

// 构造记录网站访问时间的对象，对象内容有：
// all 总共的访问时间
// today 当日访问时间
// 时间单位是秒
function getSaveJsonStr(domain, start) {
    var jsonStr = localStorage[domain];
    var today, all;

    var currentTimeMillis = Date.now();
    // 本次的访问时间
    var time = parseInt((currentTimeMillis - start) / 1000);

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

    return {
        today,
        all
    };
}

// 将每个网站的今日访问时间"today"更新为0,。
function setTodayZero() {
    var domainsStr = localStorage["domains"];
    if (domainsStr != null) {
        var domainsArr = domainsStr.split(",");
        for (var i = 0; i < domainsArr.length; i++) {
            var domain = domainsArr[i];
            var domainObj = JSON.parse(localStorage[domain]);
            domainObj.today = 0;
            localStorage[domain] = JSON.stringify(domainObj);
        }
    }
}

// 设置"today"为今日日期
function setTodayDate() {
    localStorage["today"] = getDateString();
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

//返回一个时间，格式：2018/1/25
function getDateString(millis) {
    if (millis != null) {
        return new Date(millis).toLocaleDateString("zh-Hans-CN");
    } else {
        return new Date().toLocaleDateString("zh-Hans-CN");
    }
}

function filterUrl(url) {
    // 进入Chrome的内置页面，就不用计时了，停止计时状态
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://") || url.startsWith("file://")) {
        return true;
    }
    // 下载链接类型
    if (url.startsWith("ed2k://")) {
        return true;
    }
}

// 一些定时循环任务：
// 1.停止最小化的窗口的计时
// 2.电脑锁定、休眠时不计时
setInterval(function () {
    chrome.idle.queryState(15, function (state) {
        // 获取电脑是否处于"锁定"或“休眠”状态
        if (state === 'locked' || state === 'idle') {
            windowsArr.forEach(function (windowId) {
                chrome.windows.get(windowId, function callback(window) {
                    saveTime(windowId);
                    localStorage.removeItem(windowId);
                });
            });
        } else {
            windowsArr.forEach(function (windowId) {
                chrome.windows.get(windowId, { populate: true }, function callback(window) {
                    // 窗口最小化时、窗口没有聚焦停止计时
                    if (window.state == "minimized" || window.focused == false) {
                        saveTime(windowId);
                        localStorage.removeItem(windowId);
                    } else if (localStorage[windowId] == null) { // 不是最小化也没有计时信息
                        window.tabs.forEach(function (tab) {
                            if (tab.highlighted) {
                                startTimer(windowId, tab.id, tab.url);
                            }
                        });
                    }
                });
            });
        }
    });
}, 1000);

// 每10秒自动保存一次计时
setInterval(function () {
    windowsArr.forEach(function (windowId) {
        chrome.windows.get(windowId, { populate: true }, function callback(window) {
                saveTime(windowId);
        });
    });
}, 10000);
