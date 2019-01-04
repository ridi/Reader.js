import _Content from '../common/_Content';

export default class Content extends _Content {
  get customElementFromPointEnabled() { return true; }

  /**
   * @param {Function} callback
   */
  reviseImages(callback) {
    const { pageWidthUnit, pageHeightUnit, pageGap } = this.reader.context;
    const screenWidth = pageWidthUnit - pageGap;
    const screenHeight = pageHeightUnit;
    const elList = [];
    const els = this.images;

    const tryReviseImages = () => {
      if (els.length === elList.length) {
        const results = [];
        elList.forEach((el) => {
          const result = this.reviseImage(el, screenWidth, screenHeight);
          if (result.width.length || result.height.length || result.position.length) {
            results.push({
              el,
              width: result.width,
              height: result.height,
              position: result.position,
            });
          }
        });

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
        callback();
      }
    };

    for (let i = 0; i < els.length; i += 1) {
      const el = els[i];
      if (el.complete) {
        elList.push(el);
      } else {
        el.addEventListener('load', () => {
          elList.push(el);
          tryReviseImages();
        });
        el.addEventListener('error', () => {
          elList.push(null);
          tryReviseImages();
        });
      }
    }

    tryReviseImages();
  }
}
