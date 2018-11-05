// Libs
import Dexie from 'dexie'
// Local
import Path from './Path'
import States from './States'

let cachedInstances = {}

class PersistDude {
  constructor(name) {
    this.name = name

    this.db = new Dexie(name)
    this.db.version(1).stores({
      items: 'id, _state'
    })
  }

  static getDB(name) {
    if (!cachedInstances[name]) {
      cachedInstances[name] = new PersistDude(name)
    }

    return cachedInstances[name]
  }

  // TODO: Validate objects (should not contain any keys starting with _ or id)

  /**
   * Creates a new db entry
   * @param {String} path Must end with an id (e.g. 'level1/someid' or 'level1/someid/level2/otherid')
   * @param {Object} obj Object to store
   */
  async add(path, obj) {
    const pathObj = new Path(path)
    const { id, parentId, currentType } = pathObj

    // If the item has a parent register that the parent has children
    if (parentId) {
      const parent = this.db.items.get(parentId)
      let _children = parent._children || []

      if (!_children.contains(currentType)) {
        _children.push(currentType)
        await this.db.items.update(parentId, { _children })
      }
    }

    await this.db.items.add({ ...obj, id, _state: States.new })
  }

  /**
   * Merges the updates with an existing item
   * @param {String} path Must end with an id (e.g. 'level1/someid' or 'level1/someid/level2/otherid')
   * @param {Object} updates Object that is merged with the existing object
   */
  async update(path, updates) {
    const pathObj = new Path(path)
    const id = pathObj.id

    const currentItem = await this.db.items.get(id)

    // In the case of a new item there is no need for back-ups.
    if (currentItem.state === States.new) {
      await this.db.items.update(id, updates)
      return
    }

    const _state =
      currentItem.state === States.inSync ? States.updated : currentItem.state

    await this.db.items.update(id, {
      ...updates,
      _backup: currentItem,
      _state
    })
  }

  /**
   * Marks the specified item as deleted (_state: States.deleted) and deletes all of its children
   * @param {String} path Path to delete (must end with an id (e.g. 'level1/someid' or 'level1/someid/level2/otherid'))
   */
  async delete(path) {
    const pathObj = new Path(path)
    const id = pathObj.id

    const currentItem = await this.db.items.get(id)

    // In the case of a new item there is no need for back-ups.
    if (currentItem.state === States.new) {
      await this.db.items.delete(id)
    } else {
      await this.db.items.update(id, {
        _backup: currentItem,
        _state: States.deleted
      })
    }

    // Delete all children
    let deletions = []
    if (Array.isArray(currentItem._children)) {
      currentItem._children.forEach(async childrenType => {
        const childrenPathStart = pathObj.getChildrenPath(childrenType)
        const deletionPromise = this.db.items
          .where('id')
          .startsWith(childrenPathStart)
          .delete()
        deletions.push(deletionPromise)
      })
    }

    await Promise.all(deletions)
  }

  /**
   * Get the value of the specified path
   * @param {String} path Path to retreive the value of
   */
  async get(path) {
    const pathObj = new Path(path)
    const id = pathObj.id

    //console.log(`get//id: ${id}`)

    if (pathObj.isItem) {
      const item = await this.db.items.get(id)

      return item && item._state === States.deleted ? null : item
    }

    const items = await this.db.items
      .where('id')
      .startsWith(id)
      .toArray()

    return items.filter(item => item._state !== States.deleted)
  }

  /**
   * Change the id of the specified and all of its descendants
   * @param {String} oldPath Path with ID to change
   * @param {String} newPath Path with ID to change to
   */
  async changeId(oldPath, newPath) {}

  /**
   * Retrieve an array with all the required updates since the last sync
   */
  async getChanges() {
    throw Error('Not implemented')
  }

  /**
   * True if there are mutations pending to sync with the remote server
   */
  async hasPendingChanges() {
    throw Error('Not implemented')
  }

  /**
   *
   * @param {Array} queryResults
   * @param {Array} mutationResults
   */
  async updateFromService(queryResults, mutationResults) {
    throw Error('Not implemented')
  }

  /**
   * Returns the time of the most recent item changed
   */
  async getLastChangedTime() {
    throw Error('Not implemented')
  }

  /**
   * Delete the whole database
   */
  async deleteDb() {
    await this.db.delete()

    delete cachedInstances[this.name]
  }
}

export const getDB = PersistDude.getDB
