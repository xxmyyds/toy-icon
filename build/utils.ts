import path from 'path'

export const camelcase = (fileName: string) => {
  const str = fileName.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : ''
  })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const getName = (file: string) => {
  const filename = path.basename(file).replace('.svg', '')
  const componentName = camelcase(filename)
  return {
    componentName,
  }
}
