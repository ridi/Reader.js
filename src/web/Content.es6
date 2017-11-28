import _Content from '../common/_Content';

export default class Content extends _Content {
  /**
   * @returns {Node[]}
   */
  fetchNodes() {
    return super.fetchNodes(true);
  }
}
