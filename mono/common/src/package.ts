import * as path from 'path'


export function getDependencies(name: string, depth: number = 0) {
  if (depth > 10) {
    return []
  }

  const filepath = path.join(__dirname, `../../${name}/package.json`)
  const packagejson = require(filepath)
  const dependencies = Object.keys(packagejson['dependencies']).filter(name => /^@mono/.test(name)).map(name => name.slice(6))

  for (let dependency of [...dependencies]) {
    dependencies.push(...getDependencies(dependency, depth+1))
  }

  return [...new Set(dependencies)]
}

export default {
  getDependencies,
}