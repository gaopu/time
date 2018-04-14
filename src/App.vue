<template>
    <div id="app">
        <nav class="navbar navbar-dark sticky-top bd-navbar">
            <a href="#" class="navbar-brand">
                <img src="./assets/icon32.png"> 时间
            </a>
            <button id="version" class="btn btn-sm btn-outline-secondary" disabled>{{version}}</button>
        </nav>
        <div class="container-fluid">
            <div class="row">
                <nav class="col-1 bg-light sidebar">
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a href="#" class="nav-link" v-bind:class="{active: tab==='time-dashboard'}" v-on:click="tabChange('time-dashboard')">
                                <i class="icon-desktop"></i>
                                概览</a>
                        </li>
                        <li class="nav-item">
                            <a href="#" class="nav-link" v-bind:class="{active: tab==='time-history'}" v-on:click="tabChange('time-history')">
                                <i class="icon-bar-chart"></i>
                                历史</a>
                        </li>
                        <li class="nav-item">
                            <a href="#" class="nav-link" v-bind:class="{active: tab==='time-options'}" v-on:click="tabChange('time-options')">
                                <i class="icon-cogs"></i>
                                设置</a>
                        </li>
                    </ul>
                </nav>
                <div class="col" id="time-main">
                    <TimeDashboard v-if="tab==='time-dashboard'"></TimeDashboard>
                    <TimeHistory v-if="tab==='time-history'"></TimeHistory>
                    <TimeOptions v-if="tab==='time-options'"></TimeOptions>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
// 引入自定义组件
import TimeDashboard from './myVueComponent/time-dashboard.vue'
import TimeHistory from './myVueComponent/time-history.vue'
import TimeOptions from './myVueComponent/time-options.vue'

export default {
    name: "app",
    data() {
        return {
            tab: "time-dashboard",
            version: localStorage["version"]
        };
    },
    methods: {
        tabChange: function(tabName) {
            this.tab = tabName;
        }
    },
    components: {
        TimeDashboard, TimeHistory, TimeOptions
    }
};
</script>

<style lang="css">
.bd-navbar {
    background-color: #3C454C;
}

.sidebar {
    padding: 0;
}
.sidebar a {
    color: #333;
    opacity: 0.70;
}
.sidebar .active {
    font-weight: bold;
    color: #13b2ad;
    opacity: 1;
}
.sidebar a:hover {
    font-weight: bold;
    opacity: 1;
}
</style>