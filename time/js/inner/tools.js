// 返回网站访问时间的详细信息
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
        site: domain,
        date: getDateString(start),
        start: parseInt(start / 1000),
        duration: time,
        today: today,
        all: all
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

//返回格式：2018/1/25
function getDateString(millis) {
    if (millis != null) {
        return new Date(millis).toLocaleDateString("zh-Hans-CN");
    } else {
        return new Date().toLocaleDateString("zh-Hans-CN");
    }
}

function filterUrl(url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return true;
    }
}