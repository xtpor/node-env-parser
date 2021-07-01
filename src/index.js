const _ = require("lodash")
const { get, set, setIn } = require("immutable")


function parseAsJson(t) {
  try {
    return JSON.parse(t)
  } catch (_error) {
    return t
  }
}

function parseAttributeName(envName, prefix) {
  return envName
    .slice(prefix.length + 1)
    .split("__")
    .map(_.camelCase)
    .map(t => {
      const x = Number(t)
      return isFinite(x) && (x === ~~x) ? x : t
    })
}

function prepareKeyPath(object, keyPath) {
  if (keyPath.length === 0) {
    return object
  } else {
    const [key, ...rest] = keyPath
    const isIndex = typeof key === "number"

    if (Array.isArray(object)) {
      // is an array
      if (isIndex) {
        const value = get(object, key)
        return set(object, key, prepareKeyPath(value, rest))
      } else {
        const casted = Object.fromEntries(Object.entries(object))
        return prepareKeyPath(casted, keyPath)
      }
    } else if (typeof object === "object" && object !== null) {
      // is an object
      const value = get(object, key)
      return set(object, key, prepareKeyPath(value, rest))
    } else {
      // neither array nor object
      if (isIndex) {
        return prepareKeyPath([], keyPath)
      } else {
        return prepareKeyPath({}, keyPath)
      }
    }
  }
}

function envToAttributes(env, prefix) {
  return Object.entries(env)
    .filter(([key, value]) => key.startsWith(prefix + "_"))
    .map(([key, value]) => [parseAttributeName(key, prefix), parseAsJson(value)])
}

function attributesToObject(pairs) {
  return pairs.reduce((acc, [keyPath, value]) => {
    const a0 = prepareKeyPath(acc, keyPath)
    const a1 = setIn(a0, keyPath, value)
    return a1
  }, {})
}

function parse(env, prefix) {
  return attributesToObject(envToAttributes(env, prefix))
}

exports.parse = parse
