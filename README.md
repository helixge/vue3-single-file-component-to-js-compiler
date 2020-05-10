vue-single-file-component-to-js-compiler
=====================

Converts Vue single component file:
```
<template>
  <div>{{ text }}</div>
</template>

<script>
export default {
  data: function() {
    return {
      text: "Example"
    };
  },
  methods: {}
};
</script>
```

Into Vue component declaration in JS:
```
Vue.component('test-component', {
  data: function () {
    return {
      text: "Example"
    };
  },
  methods: {},
  template: `
  <div>{{ text }}</div>
`
});
```