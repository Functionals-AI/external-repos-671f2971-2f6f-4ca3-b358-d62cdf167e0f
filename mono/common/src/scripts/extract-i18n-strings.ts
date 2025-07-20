import * as path from 'path'
import * as fs from 'fs'
import { ts, Project } from 'ts-morph'

const pkgs = ['telenutrition', 'telenutrition-api', 'common']
const root = path.join(__dirname, '..', '..', '..')
const dest = path.join(__dirname, '..', '..', 'locales')
const locale = {}
let total = 0

for (let pkg of pkgs) {
  console.log(`Scanning package: ${pkg}`)
  
  const project = new Project()
  project.addSourceFilesAtPaths(`${root}/${pkg}/src/**/*.ts`)

  const files = project.getSourceFiles()
  
  for (let file of files) {
    let count = 0

    file.forEachDescendant(node => {
      if (node.getKind() == ts.SyntaxKind.CallExpression && node.getFirstChild()?.getText() === 'i18n.__') {
        if (node.getChildCount() >= 4) {
          const parameters = node.getChildAtIndex(2)
          if (parameters.getChildCount() >= 1) {
            const raw = parameters.getChildAtIndex(0).getText()
            const string = raw.slice(1, raw.length-1)

            if (!(string in locale)) {
              locale[string] = string
              count++
            }
          }
        }
      }
    })

    if (count > 0) {
      console.log(`  ${file.getFilePath()}: ${count} found`)
      total += count
    }
  }
}

console.log(`\nWriting ${total} strings to file: ${dest}/en.json`)

fs.writeFileSync(`${dest}/en.json`, JSON.stringify(locale, Object.keys(locale).sort(), 2))