# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

* None.

## [1.0.35 (2019-07-03)]

### Added

- [공통] 이미지 크게보기 인터렉션 개선을 위한 기능 확장

## [1.0.34 (2019-07-01)]

### Added

- [안드] `Array.from` polyfill 추가

### Fixed

- [공통] 구 버전 브라우저에서 `generateId` 호출 시 발생하는 스크립트 오류 수정

## [1.0.33 (2019-06-24)]

### Changed

- [공통] 이미지 크게보기 인터렉션 개선을 위한 기능 확장

## [1.0.32 (2018-10-17)]

### Changed

- [Web] 네이티브 편의를 위해 작성한 셀렉션을 웹 친화적으로 수정

## [1.0.31 (2018-10-17)]

### Changed

- [Web] 셀렉션 스크립트 오류 수정
- [공통] `Context` 생성자 파라미터 순서 변경

## [1.0.30 (2018-10-17)]

### Added

- [Web] 셀렉션 기능 추가

## [1.0.29 (2018-10-02)]

### Changed

- [공통] `getLinkFromPoint` 성능 추가 개선

## [1.0.28 (2018-09-19)]

## [1.0.27 (2018-09-19)]

### Added

- [안드] 구 버전 브라우저를 위해 `Array.find` polyfill 추가

### Changed

- [공통] `getLinkFromPoint` 성능 개선

## [1.0.26 (2018-08-06)]

### Fixed

- [iOS] 특정 조건에서 `anchor` 위치 계산에 오차가 생기는 문제 수정

## [1.0.25 (2018-08-02)]

### Fixed

- [안드] 스타일 변경으로 인해 스파인의 마지막 페이지로 밀려날 경우 빈 페이지만 보이는 문제 수정

## [1.0.24 (2018-06-25)]

### Fixed

- [안드] Chrome의 폰트 로딩 시점에 따라 페이징 오차가 발생하는 문제 수정

## [1.0.23 (2018-06-21)]

### Changed

- [TTS] Chunk 생성 성능 개선

### Fixed

- [TTS] 특정 조건에서 텍스트를 단어 단위로 끊어서 Chunk로 만드는 문제 수정

## [1.0.22 (2018-06-04)]

### Fixed

- [안드] 특정 조건에서 스파인의 마지막 페이지가 누락되어 보이는 문제 수정

## [1.0.21 (2018-05-29)]

### Fixed

- [안드] 특정 기기이서 다단이 잘려 보이거나 본문이 작아 보이는 문제 수정

## [1.0.20 (2018-03-14)]

### Changed

- [공통] `visibility: hidden` 스타일이 있는 텍스트는 읽지 않도록

### Fixed

- [TTS] 특정 Chrome에서 보이지 않는 텍스트를 Chunk로 만드는 문제 수정

## [1.0.19 (2018-02-20)]

### Fixed

- [안드/Web] `self-import`가 포함된 스타일에서 `getMatchedCSSRules` polyfill을 이용해 Rule을 가져오려 할 경우 스크립트 오류가 발생하는 문제 수정

## [1.0.18 (2018-01-25)]

### Fixed

- [안드/Web] `getMatchedCSSRules` polyfill을 이용해 Global Rule을 가져오려 할 경우 스크립트 오류가 발생하는 문제 수정

## [1.0.17 (2017-12-26)]

### Changed

- [TTS] 곱셈 기호가 반복될 경우 Chunk로 만들지 않도록

## [1.0.16 (2017-12-16)]

### Added

- [안드/Web] Chrome 64에서 제거되는 `getMatchedCSSRules`를 대체하기 위해 polyfill 추가

### Changed

- 플랫폼 별로 필요한 polyfill만 배포 파일에 포함시키도록 개선

## [1.0.15 (2017-12-15)]

### Added

- [공통] 구 버전 브라우저를 위해 `requestIdleCallback` polyfill 추가

## [1.0.14 (2017-12-04)]

### Added

- [공통] Chrome 버전 별 이슈를 대응하는 `Chrome.es6` 추가

### Changed

- [안드] Chrome 47, 49~60 대응 코드는 안드 환경에서만 사용 하도록

## [1.0.13 (2017-12-01)]

### Fixed

- [Web] `viewport`를 덮어쓰지 않도록 수정

## [1.0.12 (2017-11-29)]

### Fixed

- [공통] 일부 브라우저에서 이미지에 `user-select: none` 스타일이 있는 경우 `NodeLocation`을 구할 때 스크립트 오류가 발생하는 문제 수정

## [1.0.11 (2017-11-28)]

### Changed

- IE 지원

## [1.0.10 (2017-11-24)]

### Changed

- [TTS-JS-UnitTest](https://github.com/ridi-viewer/TTS-JS-Unit-Test)에서 상세한 테스트를 하기 위해 내부 상수 값을 변경할 수 있도록 수정

## [1.0.9 (2017-11-21)]

### Fixed

- [공통] 특정 조건에서 선택할 수 없는 영역이 생기는 문제 수정
- [공통] 특정 조건에서 이미지의 `NodeLocation`을 구할 수 없는 문제 수정
- [공통] 이미지의 `NodeLocation`으로 `offset`을 구할 수 없는 문제 수정

## [1.0.8 (2017-11-21)]

## [1.0.7 (2017-11-14)]

### Changed

- [공통] 최소 단위인 `TextNode`만 다루고 있기 때문에 `selectNodeContents`와 `selectNode`를 혼용하지 않고 `selectNode`만 사용하도록 수정

## [1.0.6 (2017-11-03)]

### Fixed

- [안드] 두쪽 보기에서 발생하는 페이징 오차 수정

## [1.0.5 (2017-10-30)]

### Fixed

- [안드] 내부 링크를 찾으려 할 때 발생하는 스크립트 오류 수정

## [1.0.4 (2017-10-26)]

### Fixed

- [안드] 두쪽 보기에서 오른쪽 페이지 영역을 다음 페이지로 인식하여 이어서 선택하기가 동작하는 문제 수정 
- [안드] 일부 기기에서 다단이 잘려 보이는 문제 수정

## [1.0.3 (2017-10-13)]

### Fixed

- [공통] 스타일 변경 시 항상 첫 페이지로 이동하는 문제 수정
- [공통] 일부 구 버전 브라우저에서 `Object.assign`을 지원하지 않아 발생하는 스크립트 오류 수정

## [1.0.2 (2017-10-13)]

### Changed

- [react-viewer](https://github.com/ridi/react-viewer)를 비롯해 외부에서 `import`하기 용이하도록 배포 파일 구조 개선

## [1.0.1 (2017-10-10)]

### Changed

- [TTS-JS-UnitTest](https://github.com/ridi-viewer/TTS-JS-Unit-Test)를 위해 `TTSUtil`, `TTSUtterance`를 외부에서 접근 가능하도록 수정

## [1.0.0 (2017-10-10)]

- 첫 릴리즈

[Unreleased]: https://github.com/ridi/Reader.js/compare/1.0.35...HEAD
[1.0.35 (2019-07-03)]: https://github.com/ridi/Reader.js/compare/1.0.34...1.0.35
[1.0.34 (2019-07-01)]: https://github.com/ridi/Reader.js/compare/1.0.33...1.0.34
[1.0.33 (2019-06-24)]: https://github.com/ridi/Reader.js/compare/1.0.32...1.0.33
[1.0.32 (2018-10-17)]: https://github.com/ridi/Reader.js/compare/1.0.31...1.0.32
[1.0.31 (2018-10-17)]: https://github.com/ridi/Reader.js/compare/1.0.30...1.0.31
[1.0.30 (2018-10-17)]: https://github.com/ridi/Reader.js/compare/1.0.29...1.0.30
[1.0.29 (2018-10-02)]: https://github.com/ridi/Reader.js/compare/1.0.28...1.0.29
[1.0.28 (2018-09-19)]: https://github.com/ridi/Reader.js/compare/1.0.27...1.0.28
[1.0.27 (2018-09-19)]: https://github.com/ridi/Reader.js/compare/1.0.26...1.0.27
[1.0.26 (2018-08-06)]: https://github.com/ridi/Reader.js/compare/1.0.25...1.0.26
[1.0.25 (2018-08-02)]: https://github.com/ridi/Reader.js/compare/1.0.24...1.0.25
[1.0.24 (2018-06-25)]: https://github.com/ridi/Reader.js/compare/1.0.23...1.0.24
[1.0.23 (2018-06-21)]: https://github.com/ridi/Reader.js/compare/1.0.22...1.0.23
[1.0.22 (2018-06-04)]: https://github.com/ridi/Reader.js/compare/1.0.21...1.0.22
[1.0.21 (2018-05-29)]: https://github.com/ridi/Reader.js/compare/1.0.20...1.0.21
[1.0.20 (2018-03-14)]: https://github.com/ridi/Reader.js/compare/1.0.19...1.0.20
[1.0.19 (2018-02-20)]: https://github.com/ridi/Reader.js/compare/1.0.18...1.0.19
[1.0.18 (2018-01-25)]: https://github.com/ridi/Reader.js/compare/1.0.17...1.0.18
[1.0.17 (2017-12-26)]: https://github.com/ridi/Reader.js/compare/1.0.16...1.0.17
[1.0.16 (2017-12-16)]: https://github.com/ridi/Reader.js/compare/1.0.15...1.0.16
[1.0.15 (2017-12-15)]: https://github.com/ridi/Reader.js/compare/1.0.14...1.0.15
[1.0.14 (2017-12-04)]: https://github.com/ridi/Reader.js/compare/1.0.13...1.0.14
[1.0.13 (2017-12-01)]: https://github.com/ridi/Reader.js/compare/1.0.12...1.0.13
[1.0.12 (2017-11-29)]: https://github.com/ridi/Reader.js/compare/1.0.11...1.0.12
[1.0.11 (2017-11-28)]: https://github.com/ridi/Reader.js/compare/1.0.10...1.0.11
[1.0.10 (2017-11-24)]: https://github.com/ridi/Reader.js/compare/1.0.9...1.0.10
[1.0.9 (2017-11-21)]: https://github.com/ridi/Reader.js/compare/1.0.8...1.0.9
[1.0.8 (2017-11-21)]: https://github.com/ridi/Reader.js/compare/1.0.7...1.0.8
[1.0.7 (2017-11-14)]: https://github.com/ridi/Reader.js/compare/1.0.6...1.0.7
[1.0.6 (2017-11-03)]: https://github.com/ridi/Reader.js/compare/1.0.5...1.0.6
[1.0.5 (2017-10-30)]: https://github.com/ridi/Reader.js/compare/1.0.4...1.0.5
[1.0.4 (2017-10-26)]: https://github.com/ridi/Reader.js/compare/1.0.3...1.0.4
[1.0.3 (2017-10-13)]: https://github.com/ridi/Reader.js/compare/1.0.2...1.0.3
[1.0.2 (2017-10-13)]: https://github.com/ridi/Reader.js/compare/1.0.1...1.0.2
[1.0.1 (2017-10-10)]: https://github.com/ridi/Reader.js/compare/1.0.0...1.0.1
[1.0.0 (2017-10-10)]: https://github.com/ridi/Reader.js/compare/0.1.0...1.0.0
