export default (env: string[]): string => {
  if (!env.length) {
    return ''
  }
  const envObj = {}

  env.forEach(e => {
    envObj[e] = process.env[e]
  })

  return `if(!window.process){window.process={}};window.process.env=${JSON.stringify(
    envObj
  )};`
}
