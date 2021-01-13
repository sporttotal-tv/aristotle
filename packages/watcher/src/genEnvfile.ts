export default (env: string[]): string => {
  const envObj = {}
  env.forEach(e => {
    envObj[e] = process.env[e]
  })

  if (!env.length) {
    return ''
  }

  console.log('????????????????', env)

  return `
if (! window.process = {}) { window.process = {} };
window.process.env = ${JSON.stringify(envObj)};
`
}
