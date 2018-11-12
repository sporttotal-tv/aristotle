const loading = {}
global.imports = moduleId => {
  return (
    loading[moduleId] ||
    (loading[moduleId] = new Promise((resolve, reject) => {
      if (global[moduleId]) {
        delete loading[moduleId]
        resolve(global[moduleId])
      } else {
        const s = document.createElement('script')
        // eslint-disable-next-line
        const t = __dynamicModules__[moduleId] // holds the paths of the files (hashes)
        s.setAttribute('src', '/' + t.js)

        document.body.appendChild(s)
        if (t.css) {
          const c = document.createElement('link')
          c.rel = 'stylesheet'
          c.type = 'text/css'
          c.href = '/' + t.css
          document.head.appendChild(c)
          var cnt = 0
          c.onload = () => {
            cnt++
            if (cnt === 2) {
              delete loading[moduleId]
              resolve(global[moduleId])
            }
          }
          s.onload = () => {
            cnt++
            if (cnt === 2) {
              delete loading[moduleId]
              resolve(global[moduleId])
            }
          }
        } else {
          s.onload = () => {
            resolve(global[moduleId])
          }
        }
      }
    }))
  )
}
