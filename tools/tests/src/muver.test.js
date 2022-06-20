const { valid, clean, compare } = require('../../src/muver')
test('should validate versions', () => {
    expect(valid('2.1.5')).toBeTruthy()
    expect(valid('v10.0.0.331.2+jk34+jk34')).toBeTruthy()
    expect(valid('v10.0.0.331.2+jk34-jk34')).toBeTruthy()
    expect(valid(' v10.0.0.331.2+jk34jk34')).toBeTruthy()
    expect(valid(' 10.0.0.331.2+jk34jk34 ')).toBeTruthy()
    expect(valid('10.0.0.331.2+jk34jk34')).toBeTruthy()
    expect(valid('1.2.3.4.5.6.7.8.9.1.2.3-1abv2')).toBeTruthy()
    expect(valid('10.0.0.331.2-jk3-4jk34')).toBeTruthy()
    expect(valid('1.1.1.2-jk34jk34')).toBeTruthy()
    expect(valid('1.1.1.2+jk34jk34')).toBeTruthy()
    expect(valid('4.4.0.1477-880ae1b5')).toBeTruthy()
    expect(valid('10.0.0.331.2+jk34jk-34')).toBeTruthy()
    expect(valid('10.0.0.331.2+jk34jkA34+')).toBeTruthy()

    expect(valid('1.1..1.2+jk34jk34')).toBeFalsy()
    expect(valid('1..1.1.2+jk34jk34')).toBeFalsy()
    expect(valid('1.1.1.2+jk34jk341..1.1.2+jk34jk34')).toBeFalsy()
    expect(valid('21.21..331.2+jk34jk34')).toBeFalsy()
    expect(valid('10.0.0.331.2+jk3%4jk34')).toBeFalsy()
    expect(valid('10.0.0.331.2+jk34jk34.')).toBeFalsy()
    expect(valid('10.0.0.331.2+jk34jBk34.10.')).toBeFalsy()
})

test('should clean version', () => {
    expect(clean('=v2.1.5')).toBe('2.1.5')
    expect(clean(' =v2.1.5')).toBe('2.1.5')
    expect(clean(' 2.1.5 ')).toBe('2.1.5')

    expect(clean('~1.0.0')).toBeFalsy()
    expect(clean(' = v 2.1.5foo')).toBeFalsy()
})

test('should compare versions', () => {
    comparisons.forEach(([v0, v1]) => {
        expect(compare(v0, v1)).toBe(1)
        expect(compare(v1, v0)).toBe(-1)
        expect(compare(v0, v0)).toBe(0)
        expect(compare(v1, v1)).toBe(0)
    })

    expect(compare('1.0', '1.0.0-alpha')).toBe(1)
    expect(compare('1.0.0', '1.0.0.0-alpha')).toBe(1)
    expect(compare('1.0+aaa', '1.0+zzz')).toBe(0)

    expect(compare('=v2.1.5', '2.1.4')).toBe(1)
    expect(compare('=v2.1.5-beta', '2.1.5')).toBe(-1)
    expect(compare('=v2.1.5-beta', '2.1.5-beta+2')).toBe(0)
    expect(compare('=v2.1.5-beta+1', '2.1.5-beta+2')).toBe(0)
    expect(compare('1.0.0', '1.0.1')).toBe(-1)
    expect(compare('1.0.0', '1.0.0.1')).toBe(-1)
    expect(compare('1.0.0', '1.0.0.0')).toBe(0)

})


const comparisons = [
    ['0.0.0', '0.0.0-foo'],
    ['0.0.1', '0.0.0'],
    ['1.0.0', '0.9.9'],
    ['0.10.0', '0.9.0'],
    ['0.99.0', '0.10.0', {}],
    ['2.0.0', '1.2.3', { loose: false }],
    ['v0.0.0', '0.0.0-foo', true],
    ['v0.0.1', '0.0.0', { loose: true }],
    ['v1.0.0', '0.9.9', true],
    ['v0.10.0', '0.9.0', true],
    ['v0.99.0', '0.10.0', true],
    ['v2.0.0', '1.2.3', true],
    ['0.0.0', 'v0.0.0-foo', true],
    ['0.0.1', 'v0.0.0', true],
    ['1.0.0', 'v0.9.9', true],
    ['0.10.0', 'v0.9.0', true],
    ['0.99.0', 'v0.10.0', true],
    ['2.0.0', 'v1.2.3', true],
    ['1.2.3', '1.2.3-asdf'],
    ['1.2.3', '1.2.3-4'],
    ['1.2.3', '1.2.3-4-foo'],
    ['1.2.3-5-foo', '1.2.3-5'],
    ['1.2.3-5', '1.2.3-4'],
    ['3.0.0', '2.7.2+asdf'],
    // ['1.2.3-a.10', '1.2.3-a.5'],
    // ['1.2.3-a.b', '1.2.3-a.5'],
    // ['1.2.3-a.b', '1.2.3-a'],
    // ['1.2.3-a.b.c.10.d.5', '1.2.3-a.b.c.5.d.100'],
    ['1.2.3-r2', '1.2.3-r100']
]