module.exports = {
  augment: (predicate, behaviour) => value => {
    if (predicate(value)) {
      return value
    }
    const result = behaviour(value)
    if (result && result.then) {
      return result.then(() => value)
    } else {
      return value
    }
  }
}
