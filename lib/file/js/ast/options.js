const babylonOptions = {
  sourceType: 'module',
  plugins: [
    'jsx',
    'flow',
    'doExpressions',
    'objectRestSpread',
    'decoratorsBeforeExport',
    'classProperties',
    'exportExtensions',
    'asyncGenerators',
    'functionBind',
    'functionSent',
    'templateInvalidEscapes',
    'dynamicImport'
  ]
}

module.exports = babylonOptions
