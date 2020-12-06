<template>
  <div id="app">
      <div class="home">
    <el-menu
      default-active="1"
      class="el-menu-demo"
      mode="horizontal"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b">
      <el-menu-item index="1">opentsdb 采集管理</el-menu-item>
    </el-menu>
    <router-view></router-view>
  </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  components: {
    // WorkBench,
  },
})
export default class App extends Vue {}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  // text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
}

.el-menu-demo {
  margin: -8px !important;
}

.el-menu-item {
  font-size: 18px !important;
}

.main {
  margin: 10px;
}

.el-drawer {
  overflow: auto !important;
}
</style>
