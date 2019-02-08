const babylonOptions = {
  sourceType: 'module',
  plugins: [
    'jsx',
    'flow',
    'doExpressions',
    'objectRestSpread',
    'decorators',
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
