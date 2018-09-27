global.imports = moduleId => {
  return new Promise((resolve, reject) => {
    if (global[moduleId]) {
      resolve(global[moduleId])
    } else {
      const s = document.createElement('script')
      // eslint-disable-next-line
      const t = __dynamicModules__[moduleId] // holds the paths of the files (hashes)
      s.setAttribute('src', t.js)
      s.onload = () => {
        resolve(global[moduleId])
      }
      document.body.appendChild(s)
      if (t.css) {
        const c = document.createElement('link')
        c.rel = 'stylesheet'
        c.type = 'text/css'
        c.href = t.css
        document.head.appendChild(c)
      }
    }
  })
}
