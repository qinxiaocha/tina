import clone from 'clone'
import map from 'just-map-object'
import filter from 'just-filter-object'

function addHooks (context, handlers, isPrepend = false) {
  let result = {}
  for (let name in handlers) {
    result[name] = function handler (...args) {
      if (isPrepend) {
        handlers[name].apply(this, args)
      }
      if (typeof context[name] === 'function') {
        context[name].apply(this, args)
      }
      if (!isPrepend) {
        handlers[name].apply(this, args)
      }
    }
  }
  return {
    ...context,
    ...result,
  }
}

export const appendHooks = (context, handlers) => addHooks(context, handlers)
export const prependHooks = (context, handlers) => addHooks(context, handlers, true)

export function linkProperties ({ TargetClass, getSourceInstance, properties }) {
  properties.forEach((name) => {
    Object.defineProperty(TargetClass.prototype, name, {
      set: function (value) {
        let context = getSourceInstance(this)
        context[name] = value
      },
      get: function () {
        let context = getSourceInstance(this)
        let member = context[name]
        if (typeof member === 'function') {
          return member.bind(context)
        }
        return member
      },
    })
  })
  return TargetClass
}

export function initializeData (adapter, data, properties) {
  return () => {
    let { isData, fromPlainObject, merge } = adapter
    data = isData(data) ? data : fromPlainObject(clone(data))
    if (typeof properties === 'object') {
      let defaults = fromPlainObject(
        map(
          filter(
            properties,
            (name, property) => typeof property === 'object' && typeof property.value !== 'undefined',
          ),
          (name, property) => property.value,
        ),
      )
      data = merge(data, defaults)
    }
    return data
  }
}
