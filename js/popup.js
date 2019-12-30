var bg = chrome.extension.getBackgroundPage();

// 指定图表的配置项和数据
var option = null;
// 图表实例
var myChart = null;

// 在页面画出饼图，flag有两种值，today或者all，today就取当日的数据，all就取总共的数据。默认是当日的数据
// 我发现页面刚一打开时，第一个参数打印出来会是一个Event对象，应该是页面load的事件，所以这里将flag放入第二个参数
function draw(event, flag = "today") {
    if (myChart == null) {
        var todayBtn = $("#today");
        var allBtn = $("#all");

        todayBtn.on("click", eventFunction);
        allBtn.on("click", eventFunction);
    }

    initOption();
    updateTime();

    // 还没有记录过
    if (localStorage["domains"] == null) {
        return;
    }

    // 根据显示个数调整显示样式
    var showCounts = localStorage["show"];
    if (showCounts == 15) {
        var mainDiv = $("#main");
        mainDiv.css("height","400px");
        option.legend.height = 400;
    } else if (showCounts == 20) {
        var mainDiv = $("#main");
        mainDiv.css("height","500px");
        option.legend.height = 500;
    }

    // 基于准备好的dom，初始化echarts实例
    myChart = echarts.init($('#main')[0], 'macarons');
    // 使用刚指定的配置项和数据显示图表。

    var allDomainsStrArr = localStorage["domains"].split(",");
    var allDomainsObjArr = [];
    var newDomains = "";

    // 将所有domain的数据放入对象，这些对象放入allDomainsObjArr中
    allDomainsStrArr.forEach(function(item, index, array) {
        var obj = {
            domain: item
        }
        if (localStorage[item] == null) {
            return;
        }
        newDomains += item + ","
        if (flag == "today") {
            obj.value = JSON.parse(localStorage[item]).today;
        } else {
            obj.value = JSON.parse(localStorage[item]).all;
        }

        if (obj.value != 0) {
            allDomainsObjArr.push(obj);
        }
    });

    // 只显示访问时间前几的网站
    allDomainsObjArr.sort(compare);
    allDomainsObjArr = allDomainsObjArr.slice(0, showCounts);

    allDomainsObjArr.forEach(function(item, index, array) {
        option.legend.data.push(item.domain);
        option.series[0].data.push({ value: item.value, name: item.domain , url: "http://" + item.domain});
    });

    myChart.setOption(option);

    // 点击饼图，跳转到对应网站
    myChart.on("click", function(e) {
        window.open(e.data.url);
    });
}

// 右上角“今日”、“总计”的点击事件处理函数
function eventFunction() {
    var id = this.id;

    if ($(this).attr("class") != null) {
        return;
    }

    initOption();
    myChart.dispose();

    if (id == "today") {
        draw(null, "today");
        $("#all").removeAttr("class");
        $(this).attr("class", "cur");
    } else {
        draw(null, "all");
        $("#today").removeAttr("class");
        $(this).attr("class", "cur");
    }
}

// 初始化option参数
function initOption() {
    option = {
        title: {
            show: false,
            x: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                var tip = echarts.format.truncateText(params.name, 200) + "<br/>" + secondsToTimeStr(params.value) + "(" + params.percent + "%)";
                return tip;
            }
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 'middle',
            // 数组内容由series.data中的所有对象的name组成
            data: [],
            formatter: function (name) {
                return echarts.format.truncateText(name, 200);
            }
        },
        series: [{
            name: '时间',
            type: 'pie',
            radius: [0, 110],
            label: {
                normal: {
                    show: false
                }
            },
            center: [350, '50%'],
            // 数组内容是一个个对象，对象内属性有value和name
            data: [],
            itemStyle: {
                emphasis: {
                    shadowBlur: 10,
                    shadowOffsetX: 5,
                    shadowOffsetY: 5,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };
}

function compare(obj1, obj2) {
    if (obj1.value < obj2.value) {
        return 1;
    } else if (obj1.value > obj2.value) {
        return -1;
    }

    return 0;
}

// 统计所有窗口的计时并存储起来
function updateTime() {
    // 这个数组存储已经计算过存储时间的domain，第二次再碰到就不计算了
    var saved = [];

    //点击插件时，全部激活tab的访问时间都更新
    for (var i = 0; i < bg.windowsArr.length; i++) {
        var windowId = bg.windowsArr[i];

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
            saved.push(domain);
        }
    }
}

// 秒数转时间字符串
function secondsToTimeStr(seconds) {
    var days = 0;
    var hours = 0;
    var minutes = 0;

    if (seconds >= 86400) {
        days = parseInt(seconds / 86400);
        seconds -= 86400 * days;
    }

    if (seconds >= 3600) {
        hours = parseInt(seconds / 3600);
        seconds -= 3600 * hours;
    }

    if (seconds >= 60) {
        minutes = parseInt(seconds / 60);
        seconds -= 60 * minutes;
    }

    var timeStr = "";
    if (days != 0) {
        return days + "天<br>" + hours + "时" + minutes + "分" + seconds + "秒";
    } else if (hours != 0) {
        return hours + "时" + minutes + "分" + seconds + "秒";
    } else if (minutes != 0) {
        return minutes + "分" + seconds + "秒";
    } else {
        return seconds + "秒";
    }
}

// 页面加载后第一个执行
function start() {
    draw();
}

window.addEventListener("load", start, false);
