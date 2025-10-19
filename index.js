const through = require('through2')
const path = require('path')

module.exports = function (options) {
  options = options || {}
  let ext = options.ext || 'js'
  if (ext[0] != '.') {
    ext = '.' + ext
  }

  const extract = function (sourceContent, sectionName) {
    const sectionPatterns = {
      template: /<template>([\w\W]*?)<\/template>/,
      script: /<script>[\W]*?export[\W]*?default[\W]*?({[\w\W]*?});[\W]*?<\/script>/
    }

    const pattern = sectionPatterns[sectionName]
    if (!pattern) {
      return null
    }

    const match = sourceContent.match(pattern)
    return match 
      ? match[1] 
      : null
  }

  const convertFormat = function (file) {
    let sourceContent = file.contents.toString()
    let pathData = path.parse(file.path)

    if (pathData.ext != '.vue') {
      return null
    }

    const scriptContent = extract(sourceContent, 'script')
    const templateContent = extract(sourceContent, 'template')

    let dest = "window.VueComponents = window.VueComponents || {};\n"
    dest += "window.VueComponents['"
    dest += pathData.name
    dest += "'] = "
    dest += scriptContent
    dest += ',\ntemplate: `'
    dest += templateContent.replace(/`/gi, '\\`')
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
