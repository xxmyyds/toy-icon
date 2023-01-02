import { resolve } from 'path'
export const projRoot = resolve(__dirname, '..')
export const pkgRoot = resolve(projRoot, 'packages')
export const cpRoot = resolve(pkgRoot, 'toy-components')
export const entryRoot = resolve(pkgRoot, 'toy-design')
export const toolRoot = resolve(pkgRoot, 'toy-tools')
export const iconRoot = resolve(pkgRoot, 'toy-icon')
