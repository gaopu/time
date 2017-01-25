var tabId = 1, windowId = 2;

function updatePage() {
	document.getElementById("status").innerText = localStorage.m;
}

window.addEventListener("load", updatePage, false);