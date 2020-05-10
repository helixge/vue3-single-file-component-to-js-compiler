var Through = require('through2');
var Path = require('path');

module.exports = function (options) {
  options = options || {};
  let ext = options.ext || 'js';
  if (ext[0] != '.')
    ext = '.' + ext;

  let matcher = /<template>(?<template>[\w\W]*?)<\/template>[\W]*?<script>[\W]*?export[\W]*?default[\W]*?(?<script>{[\w\W]*?)};[\W]*?<\/script>/;

  function convertFormat(file) {
    let sourceContent = file.contents.toString();
    let pathData = Path.parse(file.path);

    if (pathData.ext != '.vue')
      return null;

    let groups = sourceContent.match(matcher).groups;

    let dest = "Vue.component('";
    dest += pathData.name;
    dest += "', ";
    dest += groups.script;
    dest += ',\ntemplate: `';
    dest += groups.template.replace(/`/gi, '\\`');
    dest += '`\n});';

    let newPath = Path.join(
      file.base,
      Path.dirname(file.relative),
      pathData.name + ext,
    );

    file.path = newPath;

    return dest;
  };

  return Through.obj(function (file, enc, cb) {
    var content = convertFormat(file);

    if (content != null)
      file.contents = new Buffer(content);

    this.push(file);
    cb();
  });
};

