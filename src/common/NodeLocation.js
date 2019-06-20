const INDEX_SEPARATOR = '#';

const Type = {
  TOP: 'top',
  BOTTOM: 'bottom',
};

/**
 * @class NodeLocation
 * @private @property {number} _nodeIndex
 * @private @property {number} _wordIndex
 * @private @property {string} _type
 */
class NodeLocation {
  /**
   * @returns {number}
   */
  get nodeIndex() { return this._nodeIndex; }

  /**
   * @returns {number}
   */
  get wordIndex() { return this._wordIndex; }

  /**
   * @returns {string}
   */
  get type() { return this._type; }

  /**
   * @param {number} nodeIndex
   * @param {number} wordIndex
   * @param {string} type Type.Top or Type.BOTTOM
   */
  constructor(nodeIndex = -1, wordIndex = -1, type = Type.TOP) {
    this._nodeIndex = nodeIndex;
    this._wordIndex = wordIndex;
    this._type = type;
  }

  /**
   * @returns {string}
   */
  toString() {
    return `${this.nodeIndex}${INDEX_SEPARATOR}${this.wordIndex}`;
  }

  /**
   * @param {string} string
   * @param {string} type Type.Top or Type.BOTTOM
   * @returns {NodeLocation}
   */
  static fromString(string, type) {
    const parts = string.split(INDEX_SEPARATOR);
    const nodeIndex = parseInt(parts[0], 10);
    const wordIndex = parseInt(parts[1], 10);
    return new NodeLocation(nodeIndex, wordIndex, type);
  }
}

NodeLocation.Type = Type;

export default NodeLocation;
