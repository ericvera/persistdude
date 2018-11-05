export default class Path {
  constructor(path) {
    this.rawPath = path.split('/')
  }

  get id() {
    let objectsPart = []
    let idsPart = []

    this.rawPath.forEach((value, index) => {
      if (index % 2 === 0) {
        objectsPart.push(value)
      } else {
        idsPart.push(value)
      }
    })

    return `${objectsPart.join('-')}/${idsPart.join('/')}`
  }

  get parentId() {
    if (this.rawPath.length <= 2) {
      return null
    }

    let objectsPart = []
    let idsPart = []

    this.rawPath.forEach((value, index) => {
      if (index % 2 === 0) {
        objectsPart.push(value)
      } else {
        idsPart.push(value)
      }
    })

    objectsPart.pop()
    idsPart.pop()

    return `${objectsPart.join('-')}/${idsPart.join('/')}`
  }

  get isItem() {
    return this.rawPath.length % 2 === 0
  }

  get currentType() {
    return this.rawPath.length % 2
      ? this.rawPath[this.rawPath.length - 1]
      : this.rawPath[this.rawPath.length - 2]
  }

  getChildrenPath(childrenType) {
    let objectsPart = []
    let idsPart = []

    this.rawPath.forEach((value, index) => {
      if (index % 2 === 0) {
        objectsPart.push(value)
      } else {
        idsPart.push(value)
      }
    })

    objectsPart.push(childrenType)

    return `${objectsPart.join('-')}/${idsPart.join('/')}`
  }
}
