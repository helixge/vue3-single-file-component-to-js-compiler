const through = require('through2')
const path = require('path')

module.exports = function (options) {
  options = options || {}
  let ext = options.ext || 'js'
  if (ext[0] != '.') {
    ext = '.' + ext
  }

  const matcher = /<template>(?<template>[\w\W]*?)<\/template>[\W]*?<script>[\W]*?export[\W]*?default[\W]*?(?<script>{[\w\W]*?)};[\W]*?<\/script>/

  const convertFormat = function (file) {
    let sourceContent = file.contents.toString()
    let pathData = path.parse(file.path)

    if (pathData.ext != '.vue') {
      return null
    }

    let groups = sourceContent.match(matcher).groups
    let dest = "window.VueComponents = window.VueComponents || {};\n"
    dest += "window.VueComponents['"
    dest += pathData.name
    dest += "'] = "
    dest += groups.script
    dest += ',\ntemplate: `'
    dest += groups.template.replace(/`/gi, '\\`')
    dest += '`\n};'

    let newPath = path.join(
      file.base,
      path.dirname(file.relative),
      pathData.name + ext,
    )

    file.path = newPath

    return dest
  }

  return through.obj(function (file, enc, cb) {
    var content = convertFormat(file)

    if (content != null) {
      file.contents = Buffer.from(content)
    }

    this.push(file)
    cb()
  })
}
