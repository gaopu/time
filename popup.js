var tabId = 1, windowId = 2;

function set() {
	document.getElementById("status").innerText = "tabId：" + tabId + " ; " + "windowId：" + windowId;
}

window.addEventListener("load", set, false);