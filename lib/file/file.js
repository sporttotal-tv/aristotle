module.exports = class File {
  constructor({ resolved, store, JSON }) {
    this.resolved = resolved
    this.store = store
  }
  get id() {
    return this.resolved.id
  }
  get pkg() {
    return (
      this.store.files[this.resolved.pkgFile] &&
      this.store.files[this.resolved.pkgFile].node.parsed.js
    )
  }
  toJSON() {
    const file = this
    const obj = {}
    obj.type = file.type
    obj.node = file.node
    obj.browser = file.browser
    return JSON.stringify(obj)
  }
}
