function init() {
    var versionSpan = $("#version");
    versionSpan.text("版本：" + localStorage["version"]);

    // select变动事件
    var select = $("#selectShowCounts");
    select.val(localStorage["show"]);
    select.on("change", function(event) {
        localStorage["show"] = event.target.value;

        var savingDiv = $("#saving");
        savingDiv.removeAttr("class");
        setTimeout(function() {
            savingDiv.attr("class", "invisible");
        }, 600);
    });
}
window.addEventListener("load", init, false);
