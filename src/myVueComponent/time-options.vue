<template>
    <div>
        <span>展示个数：</span>
        <select v-model="selected" v-on:change="selectedChange">
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
        </select>
    </div>
</template>

<script>
export default {
  name: "time-options",
  data() {
      return {
          selected: localStorage["show"]
      };
  },
  methods: {
      selectedChange: function() {
          localStorage["show"] = this.selected;
      }
  }
};
</script>

<style lang="sass">
</style>