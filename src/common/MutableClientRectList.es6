class MutableClientRectList { }

MutableClientRectList.prototype = Array.prototype;

const { prototype } = MutableClientRectList;

/**
 * @param {HTMLElement} rootNode
 * @returns {MutableClientRectList}
 */
prototype.toAbsolute = function toAbsolute(rootNode) {
  return this.map(rect => rect.toAbsolute(rootNode));
};

/**
 * @returns {String}
 */
prototype.toString = function toString() {
  return this.map(rect => rect.toString()).join('');
};

export default MutableClientRectList;
