var time = new Vue({
    el: "#time-main",
    data: {
        tab: "time-dashboard"
    }
});

function init() {
    var versionSpan = $("#version");
    versionSpan.text(localStorage["version"]);

    // select变动事件
    var select = $("#selectShowCounts");
    select.val(localStorage["show"]);
    select.on("change", function(event) {
        localStorage["show"] = event.target.value;
    });
}
window.addEventListener("load", init, false);