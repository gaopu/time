var bg = chrome.extension.getBackgroundPage();

function updatePage() {
	// 这个数组存储已经计算过存储时间的domain，第二次再碰到就不计算了
	var saved = [];

    //点击插件时，全部激活tab的访问时间都更新
    chrome.windows.getAll(function callback(windows) {
        for (var i = 0; i < windows.length; i++) {
            var windowId = windows[i].id;

            if (localStorage[windowId] == null) {
                continue;
            }

            var domain = JSON.parse(localStorage[windowId]).domain;
            var notSave = saved.every(function(item, index, array) {
            	// 还没存储过访问时间
            	if (domain != item) {
            		return true;
            	}
            	return false;
            });

            if (notSave) {
            	bg.saveTime(windowId);
            	saved = saved.concat(domain);
            }
        }

        var str = "";
        for (var i = 0; i < localStorage.length; i++) {
            str += localStorage.key(i) + " -> " + localStorage.getItem(localStorage.key(i)) + "\n";
        }
        document.getElementById("status").innerText = str;
    });
}

window.addEventListener("load", updatePage, false);
