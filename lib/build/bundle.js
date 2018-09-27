class Bundle {
  constructor(parent, path, store, id, file) {
    this.files = []
    this.bundles = {}
    this.dynamicBundles = []
    this.traversed = {}
    this.parent = parent
    this.path = path
    this.cssChunks = []
    this.js = []
    this.vars = []
    this.styles = {}
    this.id = id
    this.store = store
    this.leveledCJS = []
    this.file = file
  }
}

module.exports = Bundle
