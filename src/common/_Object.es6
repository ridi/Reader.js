export default class _Object {
  // FIXME: static은 오버라이딩할 수 없기 때문에 편법을 사용
  static staticOverride(from, to, methods) {
    const _to = to;
    methods.forEach((method) => {
      _to.prototype.constructor[method] = from.prototype.constructor[method];
    });
  }
}
