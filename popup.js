var bg = chrome.extension.getBackgroundPage();

// 指定图表的配置项和数据
var option = {
    title: {
        show: false,
        x: 'center'
    },
    tooltip: {
        trigger: 'item',
        formatter: function(params, ticket, callback) {
            var tip = params.name + "<br/>" + secondsToTimeStr(params.value) + "(" + params.percent + "%)";
            return tip;
        }
    },
    legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        // 数组内容由series.data中的所有对象的name组成
        data: []
    },
    series: [{
        name: '时间',
        type: 'pie',
        radius: [0, 110],
        center: [400, '55%'],
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

function draw() {
    updateTime();

    // 还没有记录过
    if (localStorage["domains"] == null) {
        return;
    }

    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('container'), 'macarons');
    // 使用刚指定的配置项和数据显示图表。

    var allDomainsStrArr = localStorage["domains"].split(",");
    var allDomainsObjArr = [];

    // 将所有domain的数据放入对象，这些对象放入allDomainsObjArr中
    allDomainsStrArr.forEach(function(item, index, array) {
        var obj = {
            domain: item,
            today: JSON.parse(localStorage[item]).today
        }

        if (obj.today != 0) {
            allDomainsObjArr = allDomainsObjArr.concat(obj);
        }
    });


    allDomainsObjArr.sort(compare);
    allDomainsObjArr = allDomainsObjArr.slice(0, 10);

    allDomainsObjArr.forEach(function(item, index, array) {
        var legendData = option.legend.data;
        var seriesData = option.series[0].data;

        option.legend.data = legendData.concat(item.domain);
        option.series[0].data = seriesData.concat({ value: item.today, name: item.domain });
    });

    myChart.setOption(option);
}

function compare(obj1, obj2) {
    if (obj1.today < obj2.today) {
        return 1;
    } else if (obj1.today > obj2.today) {
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
            saved = saved.concat(domain);
        }
    }
}

// 秒数转时间字符串
function secondsToTimeStr(seconds) {
    var hours = 0;
    var minutes = 0;

    if (seconds >= 3600) {
        hours = parseInt(seconds / 3600);
        seconds -= 3600 * hours;
    }

    if (seconds >= 60) {
        minutes = parseInt(seconds / 60);
        seconds -= 60 * minutes;
    }

    var timeStr = "";
    if (hours != 0) {
        timeStr += hours + "时" + minutes + "分";
    } else if (minutes != 0) {
        timeStr += minutes + "分";
    }

    return timeStr + seconds + "秒";
}

window.addEventListener("load", draw, false);
