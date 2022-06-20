const valid = (version) => {
    // eslint-disable-next-line
    const VERSION_REGEX = /^(\d+[\.])+\d+(\+|-|[\.])*(\w|\+|-)*$/g
    return VERSION_REGEX.test(cleanReplace(version))
}

const clean = (version) => {
    version = cleanReplace(version)
    if (valid(version)) {
        return version
    } else {
        return null
    }
}

const cleanReplace = (version) => {
    return version.trim().replace(/^[=v]+/, '')
}

const major = (version) => {
    const cleanVersion = clean(version)
    if (cleanVersion) {
        return cleanVersion.split('.')[0]
    }
    return null
}

const compareBuilds = (b1, b2, desc = true) => {
    desc = desc ? -1 : 1
    b1 = b1.split('+')[0]
    b2 = b2.split('+')[0]
    const b1Split = b1.split(/(\+|-)/)
    const b2Split = b2.split(/(\+|-)/)

    let ret = b1Split[0] - b2Split[0]

    if (ret === 0) {
        ret = String(b1).localeCompare(String(b2))
    }
    return ret
}

const rcompare = (v1, v2) => {
    return compare(v1, v2) * -1
}
const compare = (v1, v2) => {
    const v1List = clean(v1).split('.')
    const v2List = clean(v2).split('.')
    
    const lengthDiff = v1List.length - v2List.length
    const addZeros = (ammount) => Array(Math.abs(ammount)).fill(0)
    if (lengthDiff > 0) {
        v2List.push(addZeros(lengthDiff))
    } else if (lengthDiff < 0) {
        v1List.push(addZeros(lengthDiff))
    }

    const isBuild = (version) => {
        return version.includes('-') || version.includes('+')
    }

    let ret = 0

    do {
        const v1Item = v1List.splice(0, 1)[0]
        const v2Item = v2List.splice(0, 1)[0]

        if (v1Item !== v2Item) {
            if (isBuild(v1Item) && !isBuild(v2Item)) {
                ret = -1
            } else if (!isBuild(v1Item) && isBuild(v2Item)) {
                ret = 1
            } else if (isBuild(v1Item) && isBuild(v2Item)) {
                ret = compareBuilds(v1Item, v2Item)
            } else {
                ret = v1Item - v2Item
            }
            break
        }
    } while (v1List.length > 0 && v2List.length > 0)
    
    return ret > 0 ? 1 : ret < 0 ? -1 : ret
}

module.exports = {
    valid,
    clean,
    major,
    compare,
    rcompare
}
