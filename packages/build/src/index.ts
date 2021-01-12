import build from './build'
import watch from './watch'

export default opts => (opts.watch ? watch(opts) : build(opts))
