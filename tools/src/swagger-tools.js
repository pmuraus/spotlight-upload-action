const mime = require('mime-types');
const fs = require('fs')
const semver = require('semver')

const isSwaggerObject = (swaggerObject) => {
  let ret = false
  if (swaggerObject.info && swaggerObject.swagger) {
    if (semver.valid(swaggerObject.swagger) || semver.valid(swaggerObject.swagger + '.0')) {
      ret = true
    } else {
      throw Error('Invalid swagger file!')
    }
  }

  return ret
}

const fromYamlFile = async (file) => {
  const fileContent = await fs.promises.readFile(file, { encoding: 'UTF-8', flag: 'r' })
  return fromYamlFileContent(fileContent)
}

const fromYamlFileContent = (fileContent) => {
  const yaml = fileContent.toLowerCase()
  const startIndex = yaml.indexOf('\nswagger:')
  const swaggerObj = {
    swagger: yaml.substring(startIndex, yaml.indexOf('\n', startIndex + 1)).split(': ')[1].replace(/"/g, '').replace(/'/g, '')
  }
  
  if (yaml.indexOf('\ninfo:')) {
    swaggerObj.info = {}
  }

  return getSwaggerContentType(swaggerObj, true)
}

const fromJsonFile = async (file) => {
  const fileContent = await fs.promises.readFile(file, { encoding: 'UTF-8', flag: 'r' })
  return fromJsonFileContent(fileContent)
}

const fromJsonFileContent = (fileContent) => {
  return getSwaggerContentType(JSON.parse(fileContent))
}

const getSwaggerContentType = (swaggerObject, isYaml = false) => {
  return isSwaggerObject(swaggerObject) ? (isYaml ? 'application/vnd.oai.openapi' : 'application/vnd.oai.openapi+json') : (isYaml ? 'application/x-yaml' : 'application/json')
}

module.exports = {
  yaml: {
    getContentType: ({ path, content }) => {
      if (content) {
        return fromYamlFileContent(content)
      } else {
        return fromYamlFile(path)
      }
    }
  },
  json: {
    getContentType: ({ path, content }) => {
      if (content) {
        return fromJsonFileContent(content)
      } else {
        return fromJsonFile(path)
      }
    }
  }
}