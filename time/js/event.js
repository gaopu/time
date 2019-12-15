// 存储所有打开的window的id
// 不使用chrome.windows.getAll获取所有窗口id是因为那个方法是异步调用的，在一些地方需要及时处理，所以不能用异步调用的方法去处理
var windowsArr = [];

var open = indexedDB.open("time", 1);
open.onupgradeneeded = function (event) {
    var db = open.result;

    var allStore = db.createObjectStore("allStore", { keyPath: "site" });
    var allStoreIndex = allStore.createIndex("site", "site");

    var historyStore = db.createObjectStore("historyStore", { keyPath: ["site", "date"] });
    var historyStoreSiteDateIndex = historyStore.createIndex("siteDateIndex", ["site", "date"]);
}

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

setInterval(function () {
    windowsArr.forEach(function (windowId) {
        chrome.windows.get(windowId, { populate: true }, function callback(window) {
            // 最小化窗口不计时
            if (window.state == "minimized") {
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
}, 1000);
