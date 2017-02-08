function init() {
    var versionSpan = document.getElementById("version");
    versionSpan.innerText = "版本：" + localStorage["version"];

    // select变动事件
    var select = document.getElementById("selectShowCounts");
    select.value = localStorage["show"];
    select.addEventListener("change", function(event) {
        localStorage["show"] = event.target.value;

        var savingDiv = document.getElementById("saving");
        saving.removeAttribute("class");
        setTimeout(function() {
            saving.setAttribute("class", "invisible");
        }, 300);
    }, false);
}

window.addEventListener("load", init, false);
