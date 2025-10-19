const vueCompiler = require('./index.js')
const path = require('path')

const createMockFile = (filePath, contents) => {
  return {
    path: filePath,
    base: '/test',
    relative: path.relative('/test', filePath),
    contents: Buffer.from(contents)
  }
}

describe('Vue SFC to JS Compiler', () => {
  describe('Basic conversion', () => {
    it('should convert a Vue SFC to JS format', (done) => {
      const vueContent = `<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
  </div>
</template>

<script>
export default {
  data() {
    return {
      msg: 'Hello World'
    }
  }
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/HelloWorld.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain("window.VueComponents = window.VueComponents || {};")
        expect(result).toContain("window.VueComponents['HelloWorld']")
        expect(result).toContain("data() {")
        expect(result).toContain("msg: 'Hello World'")
        expect(result).toContain("template: `")
        expect(result).toContain('<div class="hello">')
        expect(result).toContain('{{ msg }}')
        expect(file.path).toBe('/test/HelloWorld.js')
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle components with methods', (done) => {
      const vueContent = `<template>
  <button @click="handleClick">Click me</button>
</template>

<script>
export default {
  methods: {
    handleClick() {
      console.log('clicked')
    }
  }
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/Button.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain("window.VueComponents['Button']")
        expect(result).toContain('methods: {')
        expect(result).toContain('handleClick()')
        expect(result).toContain('@click="handleClick"')
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle backticks in template by escaping them', (done) => {
      const vueContent = `<template>
  <div>Use \`backticks\` for code</div>
</template>

<script>
export default {
  name: 'CodeExample'
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/CodeExample.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain('Use \\`backticks\\` for code')
        expect(result).not.toContain('Use `backticks` for code')
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })
  })

  describe('Custom options', () => {
    it('should use custom extension when provided', (done) => {
      const vueContent = `<template>
  <div>Test</div>
</template>

<script>
export default {
  name: 'Test'
};
</script>`

      const stream = vueCompiler({ ext: 'jsx' })
      const mockFile = createMockFile('/test/Test.vue', vueContent)

      stream.on('data', (file) => {
        expect(file.path).toBe('/test/Test.jsx')
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle extension with dot prefix', (done) => {
      const vueContent = `<template>
  <div>Test</div>
</template>

<script>
export default {
  name: 'Test'
};
</script>`

      const stream = vueCompiler({ ext: '.mjs' })
      const mockFile = createMockFile('/test/Test.vue', vueContent)

      stream.on('data', (file) => {
        expect(file.path).toBe('/test/Test.mjs')
        done()
      })

      stream.write(mockFile)
      stream.end()
    })
  })

  describe('Edge cases', () => {
    it('should not process non-Vue files', (done) => {
      const jsContent = 'const x = 1;'
      const stream = vueCompiler()
      const mockFile = createMockFile('/test/script.js', jsContent)
      const originalContent = jsContent

      stream.on('data', (file) => {
        expect(file.contents.toString()).toBe(originalContent)
        expect(file.path).toBe('/test/script.js')
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle multiline templates', (done) => {
      const vueContent = `<template>
  <div>
    <header>
      <h1>Title</h1>
    </header>
    <main>
      <p>Content</p>
    </main>
    <footer>
      <p>Footer</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'MultiLine'
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/MultiLine.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain('<header>')
        expect(result).toContain('<main>')
        expect(result).toContain('<footer>')
        expect(result).toContain('</div>')
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle components with computed properties', (done) => {
      const vueContent = `<template>
  <div>{{ fullName }}</div>
</template>

<script>
export default {
  data() {
    return {
      firstName: 'John',
      lastName: 'Doe'
    }
  },
  computed: {
    fullName() {
      return this.firstName + ' ' + this.lastName
    }
  }
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/Computed.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain('computed: {')
        expect(result).toContain('fullName()')
        expect(result).toContain('{{ fullName }}')
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle nested directory paths', (done) => {
      const vueContent = `<template>
  <div>Nested</div>
</template>

<script>
export default {
  name: 'Nested'
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/components/forms/Input.vue', vueContent)

      stream.on('data', (file) => {
        expect(file.path).toBe('/test/components/forms/Input.js')
        expect(file.contents.toString()).toContain("window.VueComponents['Input']")
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle components with props', (done) => {
      const vueContent = `<template>
  <div>{{ title }}</div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    }
  }
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/Props.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain('props: {')
        expect(result).toContain('title: {')
        expect(result).toContain('type: String')
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })
  })

  describe('Output format', () => {
    it('should generate correct output structure', (done) => {
      const vueContent = `<template>
  <div>Test</div>
</template>

<script>
export default {
  name: 'Test'
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/Test.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        const lines = result.split('\n')
        
        expect(lines[0]).toBe('window.VueComponents = window.VueComponents || {};')
        expect(lines[1]).toContain("window.VueComponents['Test'] =")
        expect(result).toMatch(/template: `[\s\S]*`\s*};/)
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })
  })
})
