import flows from './flows'

export { flows }

/**
 * Gets the mono dependencies of the project
 */
export function dependencies(): string[] {
  const pkg = require('../package.json')
  const dependencies = pkg['dependencies']
  return Object.keys(dependencies).filter(key => key.startsWith('@mono/')).map(key => key.replace('@mono/', ''))
}

export default {
  flows,
  dependencies,
}