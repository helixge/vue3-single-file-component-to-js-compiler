# vue-single-file-component-to-js-compiler

Converts Vue3 single component file:

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
window.VueComponents = window.VueComponents || {};
window.VueComponents['test-component'] = {
  data: function () {
    return {
      text: "Example"
    };
  },
  methods: {},
  template: `
  <div>{{ text }}</div>
`
};
```

which can later be used to register components on the app instance:

```
const app = Vue.createApp({});

if (window.VueComponents) {
    Object.keys(window.VueComponents).forEach(function(componentName) {
        app.component(componentName, window.VueComponents[componentName]);
    });
}

app.mount(...);
```
