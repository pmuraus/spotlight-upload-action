const { yaml, json } = require('../../src/swagger-tools.js')
const path = require('path')

describe('swagger files should be processed', () => {
    test('should set application/vnd.oai.openapi+json for swagger json files', async () => {
        const contentType = await json.getContentType({ path: path.join(__dirname, 'swagger.json') });
        expect(contentType).toBe('application/vnd.oai.openapi+json')
    })

    test('should set application/vnd.oai.openapi for swagger yaml files', async () => {
        const contentType = await yaml.getContentType({ path: path.join(__dirname, 'swagger.yaml') });
        expect(contentType).toBe('application/vnd.oai.openapi')
    })
})
