import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { compileScript, compileTemplate, parse } from 'vue/compiler-sfc'
import { optimize } from 'svgo'
import type { Plugin } from 'vite'
import type { CompilerOptions, SourceFile } from 'ts-morph'
import { Project } from 'ts-morph'
import { pkgRoot, projRoot } from '../contants'
import { getName } from './../utils'

//  * fork = require( https://github.com/element-plus/element-plus/blob/dev/internal/build/src/tasks/types-definitions.ts )

export function svg(options: {
  tsConfigFilePath: string
  outDir: string
}): Plugin {
  const { tsConfigFilePath, outDir } = options

  const svgRegex = /\.svg$/
  const svgContentToMap = new Map<string, string>()
  let project: Project
  const sourceFiles: SourceFile[] = []

  return {
    name: 'svg-loader',
    enforce: 'pre',

    async load(id) {
      if (!id.match(svgRegex)) return

      let svg

      svg = await readFile(id, 'utf-8')
      if (!svgContentToMap.has(id)) svgContentToMap.set(id, svg)

      svg = optimize(svg, {
        path: id,
      }).data

      const { code } = compileTemplate({
        id: JSON.stringify(id),
        source: svg,
        filename: id,
      })

      return `${code}\nexport default { render }`
    },

    configResolved() {
      const compilerOptions: CompilerOptions = {
        emitDeclarationOnly: true,
        outDir,
        baseUrl: projRoot,
        declaration: true,
        skipLibCheck: true,
        noImplicitAny: false,
        allowJs: true,
        allowSyntheticDefaultImports: true,
      }
      project = new Project({
        compilerOptions,
        tsConfigFilePath,
        skipAddingFilesFromTsConfig: true,
      })
    },
    async transform(code, id) {
      let content
      if (id.endsWith('.svg')) {
        const svgContent = svgContentToMap.get(id)
        const { componentName } = getName(id)

        content = `
          <template>\n
            ${svgContent}\n
          </template>\n
          <script lang="ts">\n
          import { defineComponent } from 'vue'\n
          export default defineComponent({\n
            name: "${componentName}",\n
          })\n
          </script>
         `
        const sfc = parse(content)
        const { script } = sfc.descriptor
        if (script) {
          const compiled = compileScript(sfc.descriptor, {
            id: 'xxx',
          })
          content = compiled.content
        }
      }

      sourceFiles.push(
        project.createSourceFile(id.replace('.svg', '.ts'), content || code, {
          overwrite: true,
        })
      )

      return code
    },
    async closeBundle() {
      //   typeCheck(project)

      await project.emit({
        emitOnlyDtsFiles: true,
      })

      const tasks = sourceFiles.map(async (sourceFile) => {
        const relativePath = path.relative(pkgRoot, sourceFile.getFilePath())
        console.log(`Generating definition for file: ${relativePath}`)

        const emitOutput = sourceFile.getEmitOutput()
        const emitFiles = emitOutput.getOutputFiles()

        // if (emitFiles.length === 0) throw new Error(`Emit no file: ${relativePath}`)

        const subTasks = emitFiles.map(async (outputFile) => {
          const filepath = outputFile.getFilePath()
          await mkdir(path.dirname(filepath), {
            recursive: true,
          })

          await writeFile(
            filepath,
            outputFile.getText().replace('.svg', ''),
            'utf8'
          )

          console.log(`Definition for file: ${relativePath} generated`)
        })

        await Promise.all(subTasks)
      })

      await Promise.all(tasks)
    },
  }
}

// 类型检查
// function typeCheck(project: Project) {
//   const diagnostics = project.getPreEmitDiagnostics()
//   if (diagnostics.length > 0)
//     console.log(project.formatDiagnosticsWithColorAndContext(diagnostics))
// }
