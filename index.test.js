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
    it('should generate correct output structure with template inside object', (done) => {
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
        expect(result).toMatch(/,\s*template: `[\s\S]*`\s*};/)
        
        const objectStart = result.indexOf('= {')
        const templatePos = result.indexOf('template: `')
        const objectEnd = result.lastIndexOf('};')
        
        expect(objectStart).toBeLessThan(templatePos)
        expect(templatePos).toBeLessThan(objectEnd)
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should place template as property inside the component object', (done) => {
      const vueContent = `<template>
  <div>Content</div>
</template>

<script>
export default {
  data() {
    return { count: 0 }
  }
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/Counter.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toMatch(/,\s*template: `/)
        expect(result).toMatch(/{\s*[\s\S]*data\(\)[\s\S]*,\s*template:[\s\S]*};/)
        
        const objectStart = result.indexOf('= {')
        const templatePos = result.indexOf('template: `')
        const objectEnd = result.lastIndexOf('};')
        
        expect(objectStart).toBeLessThan(templatePos)
        expect(templatePos).toBeLessThan(objectEnd)
        
        const componentCode = result.split('\n').slice(1).join('\n')
        expect(() => {
          const testCode = componentCode.replace(/window\.VueComponents\['Counter'\] = /, 'const test = ')
          eval(testCode)
        }).not.toThrow()
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle valid JS object syntax', (done) => {
      const vueContent = `<template>
  <div>Valid</div>
</template>

<script>
export default {
  name: 'Valid'
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/Valid.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        const componentCode = result.split('\n').slice(1).join('\n')
        
        expect(() => {
          const testCode = componentCode.replace(/window\.VueComponents\['Valid'\] = /, 'const test = ')
          eval(testCode)
        }).not.toThrow()
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })
  })

  describe('Complex component edge cases', () => {
    it('should handle component with async mounted hook', (done) => {
      const vueContent = `<template>
  <div class="wrapper">
    <span>Loading...</span>
  </div>
</template>

<script>
export default {
  props: {
    id: String
  },
  data: function () {
    return {
      loading: true
    }
  },
  methods: {
    async fetchData() {
      return await fetch('/api/data')
    }
  },
  async mounted() {
    await this.fetchData()
    this.loading = false
  },
  computed: {
    isReady() {
      return !this.loading
    }
  }
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/AsyncComponent.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain('async mounted()')
        expect(result).toContain('async fetchData()')
        expect(result).toContain('computed: {')
        expect(result).toContain('template: `')
        expect(result).toMatch(/computed:[\s\S]*},\s*template: `/)
        
        const objectStart = result.indexOf('= {')
        const templatePos = result.indexOf('template: `')
        const objectEnd = result.lastIndexOf('};')
        expect(objectStart).toBeLessThan(templatePos)
        expect(templatePos).toBeLessThan(objectEnd)
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle SVG content in template', (done) => {
      const vueContent = `<template>
  <div class="loader-wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
      <path d="M10,20 L30,40 L50,20" stroke="blue" fill="none" />
    </svg>
  </div>
</template>

<script>
export default {
  name: 'SvgLoader'
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/SvgLoader.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain('<svg')
        expect(result).toContain('xmlns="http://www.w3.org/2000/svg"')
        expect(result).toContain('<circle')
        expect(result).toContain('<path')
        expect(result).toContain('</svg>')
        
        const templateMatch = result.match(/template: `([\s\S]*?)`\s*};/)
        expect(templateMatch).toBeTruthy()
        expect(templateMatch[1]).toContain('<svg')
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle component with trailing whitespace in script', (done) => {
      const vueContent = `<template>
  <div>Test</div>
</template>

<script>
export default {
  name: 'WhitespaceTest'
};   
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/WhitespaceTest.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).not.toMatch(/}\s*,\s*template:/)
        expect(result).toMatch(/name: 'WhitespaceTest'\s*,\s*template:/)
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle component with empty props, methods, and computed', (done) => {
      const vueContent = `<template>
  <div>Empty sections</div>
</template>

<script>
export default {
  props: {
    
  },
  data: function () {
    return {
    }
  },
  methods: {
   
  },
  computed: {
    
  }
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/EmptySections.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain('props: {')
        expect(result).toContain('methods: {')
        expect(result).toContain('computed: {')
        expect(result).toContain('template: `')
        
        const objectStart = result.indexOf('= {')
        const templatePos = result.indexOf('template: `')
        const objectEnd = result.lastIndexOf('};')
        expect(objectStart).toBeLessThan(templatePos)
        expect(templatePos).toBeLessThan(objectEnd)
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle component with complex nested objects', (done) => {
      const vueContent = `<template>
  <div>{{ config.nested.value }}</div>
</template>

<script>
export default {
  data() {
    return {
      config: {
        nested: {
          value: 'test',
          deep: {
            property: 123
          }
        }
      }
    }
  }
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/NestedObject.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain('nested: {')
        expect(result).toContain('deep: {')
        expect(result).toContain('property: 123')
        expect(result).toMatch(/}\s*}\s*}\s*}\s*,\s*template:/)
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle component with multiline strings and special characters', (done) => {
      const vueContent = `<template>
  <div>
    <p>Line 1</p>
    <p>Line 2 with "quotes" and 'apostrophes'</p>
    <p data-attr="value with spaces"></p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: "Hello 'world' with \"quotes\""
    }
  }
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/SpecialChars.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain('"quotes"')
        expect(result).toContain("'apostrophes'")
        expect(result).toContain('data-attr="value with spaces"')
        
        const templateMatch = result.match(/template: `([\s\S]*?)`\s*};/)
        expect(templateMatch).toBeTruthy()
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })

    it('should handle real-world spinner component example', (done) => {
      const vueContent = `<template>
  <div class="loader-wrap">
    <svg class="loading-icon" xmlns="http://www.w3.org/2000/svg" width="369.628" height="379.983" viewBox="0 0 369.628 379.983">
      <defs>
        <clipPath id="clip-path">
          <path id="Clip_2" data-name="Clip 2" d="M0,0H369.628V379.983H0Z" transform="translate(0 0.482)" fill="none"></path>
        </clipPath>
      </defs>
      <g id="Group_3" data-name="Group 3" transform="translate(0 -0.482)">
        <path id="Fill_1" data-name="Fill 1" d="M23.294,189.992c-1.444,1.7" fill="#fad022"></path>
      </g>
    </svg>
  </div>
</template>

<script>
export default {
  props: {
    
  },
  data: function () {
    return {
    }
  },
  methods: {
   
  },
  async mounted() {
   
  },
  computed: {
    
  }
};
</script>`

      const stream = vueCompiler()
      const mockFile = createMockFile('/test/spinner.vue', vueContent)

      stream.on('data', (file) => {
        const result = file.contents.toString()
        
        expect(result).toContain("window.VueComponents['spinner']")
        expect(result).toContain('async mounted()')
        expect(result).toContain('<svg')
        expect(result).toContain('clipPath')
        expect(result).toContain('fill="#fad022"')
        
        expect(result).toMatch(/,\s*template: `/)
        
        const computedPos = result.lastIndexOf('computed: {')
        const templatePos = result.indexOf('template: `')
        const objectEnd = result.lastIndexOf('};')
        
        expect(computedPos).toBeLessThan(templatePos)
        expect(templatePos).toBeLessThan(objectEnd)
        
        const componentCode = result.split('\n').slice(1).join('\n')
        expect(() => {
          const testCode = componentCode.replace(/window\.VueComponents\['spinner'\] = /, 'const test = ')
          eval(testCode)
        }).not.toThrow()
        
        done()
      })

      stream.write(mockFile)
      stream.end()
    })
  })
})
