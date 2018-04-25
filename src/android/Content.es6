import _Content from '../common/_Content';

export default class Content extends _Content {
  get src() { return this._src; }

  constructor(wrapper, src) {
    super(wrapper);
    this._src = src;
  }

  /**
   * @param {Number} screenWidth
   * @param {Number} screenHeight
   */
  reviseImagesInSpine(screenWidth, screenHeight) {
    const results = [];

    const els = this.images;
    for (let i = 0; i < els.length; i += 1) {
      const el = els[i];
      const result = this.reviseImage(el, screenWidth, screenHeight);
      if (result.width.length || result.height.length || result.position.length) {
        results.push({
          el,
          width: result.width,
          height: result.height,
          position: result.position,
        });
      }
    }

    results.forEach((result) => {
      const { el, width, height, position } = result;
      if (width.length) {
        el.style.width = width;
      }
      if (height.length) {
        el.style.height = height;
      }
      if (position.length) {
        el.style.position = position;
      }
    });
  }

  /**
   * @param {Node} imgEl
   * @param {Number} screenWidth
   * @param {Number} screenHeight
   * @returns {{el: Node, width: String, height: String, position: String,
   * size: {dWidth, dHeight, nWidth, nHeight, sWidth, sHeight, aWidth, aHeight}}}
   */
  reviseImage(imgEl, screenWidth, screenHeight) {
    const result = super.reviseImage(imgEl, screenWidth, screenHeight);

    //
    // * 부모에 의한 크기 소멸 보정.
    //   - Android 2.x~4.x에서 이미지 태그의 부모 중 h1~h5 태그가 있을 때
    //    너비 또는 높이가 0으로 랜더링되는 현상을 방지한다.
    //    (해당 증상이 발생하는 bookId=852000033, 커버 이미지)
    //

    if (result.size.dWidth === 0 || result.size.dHeight === 0) {
      let el = imgEl.parentElement;
      do {
        if (el.nodeName.match(/H[0-9]/)) {
          result.position = 'absolute';
          break;
        }
      } while ((el = el.parentElement));
    }

    return result;
  }
}
