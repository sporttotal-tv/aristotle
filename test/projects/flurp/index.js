import { hash } from '@saulx/utils'

import differ from '@saulx/selva-diff'

import hub from '@saulx/hub'

const c = console.log

c(hub)

c(differ, hash)

c('wooow')

c(
  '?',
  hash({
    x: true
  })
)
