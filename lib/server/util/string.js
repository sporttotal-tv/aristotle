const replace = (str, find, replace, re) => {
  const r = find.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  return str.replace(new RegExp(re ? re(r) : r, 'g'), replace)
}

exports.replace = replace
