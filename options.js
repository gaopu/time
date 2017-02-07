function init() {
	var versionSpan = document.getElementById("version");
	versionSpan.innerText = "版本：" + localStorage["version"];
}

window.addEventListener("load", init, false);