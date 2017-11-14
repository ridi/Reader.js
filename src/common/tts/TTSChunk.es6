import TTSRange from './TTSRange';
import TTSUtterance from './TTSUtterance';
import TTSUtil from './TTSUtil';
import _Util from '../_Util';

export default class TTSChunk {
  /**
   * @returns {TTSRange}
   */
  get range() { return this._range; }

  /**
   * @param {TTSRange} newRange
   */
  set range(newRange) {
    if (newRange instanceof TTSRange) {
      this._range = newRange;
    } else {
      this._range = new TTSRange(0, this._getFullText().length);
    }
  }

  /**
   * @param {TTSPiece} pieces
   * @param {TTSRange} range
   */
  constructor(pieces, range = null) {
    this._pieces = pieces;
    this.range = range;
  }

  /**
   * @param {Reader} reader
   * @returns {{nodeIndex: Number, wordIndex: Number, text: (String), rects: String}}
   */
  toJSONForNative(reader) {
    return {
      nodeIndex: this.getStartNodeIndex(),
      wordIndex: this.getStartWordIndex(),
      text: this.getUtterance().text,
      rects: reader.rectsToAbsoluteCoord(this.getClientRects(true)),
    };
  }

  /**
   * @returns {String}
   * @private
   */
  _getFullText() {
    let fullText = '';
    this._pieces.forEach((piece) => {
      fullText += piece.text;
    });
    return fullText;
  }

  /**
   * @returns {String}
   */
  getText() {
    return this._getFullText().substring(this.range.startOffset, this.range.endOffset);
  }

  /**
   * @returns {TTSUtterance}
   */
  getUtterance() {
    return new TTSUtterance(this.getText())
      .removeNewLine()
      .removeSpecialCharacters(['≪', '≫'])
      .removeHanja()
      .removeLatin()
      .removeAllRepeatedCharacter(['<', '>', '_'])
      .replaceTilde()
      .replaceNumeric()
      .replaceBracket()
      .replaceEqual()
      .replaceDate()
      .insertPauseTag();
  }

  /**
   * @param {Number} offset
   * @returns {TTSPiece|null}
   */
  getPiece(offset) {
    let length = 0;
    return TTSUtil.find(this._pieces, (piece) => {
      length += piece.length;
      return offset <= length;
    });
  }

  /**
   * @param {TTSPiece} piece
   * @returns {Number}
   */
  getOffset(piece) {
    let offset = piece.paddingLeft;
    return this._pieces.find((item) => {
      if (item === piece) {
        return true;
      }
      offset += item.length;
      return false;
    }) !== undefined ? offset : 0;
  }

  /**
   * @returns {TTSPiece|null}
   */
  getStartWordPiece() {
    return this.getPiece(this.range.startOffset);
  }

  /**
   * @returns {TTSPiece|null}
   */
  getEndWordPiece() {
    return this.getPiece(this.range.endOffset);
  }

  /**
   * @returns {Number|null}
   */
  getStartNodeIndex() {
    return this.getStartWordPiece().nodeIndex;
  }

  /**
   * @returns {Number|null}
   */
  getEndNodeIndex() {
    return this.getEndWordPiece().nodeIndex;
  }

  /**
   * @returns {Number}
   */
  getStartWordIndex() {
    // start word piece === this._pieces[0]인 경우
    // |---------------||---- text of this._pieces[0] ----------------------
    // |--paddingLeft--||----this.startOffset-----||----Start Word-----||---
    // |-----------node.nodeValue of Start Word Piece-----------------------
    const piece = this.getStartWordPiece();
    let offsetBeforeNode = 0;

    for (let i = 0; i < this._pieces.length; i++) {
      const currentPiece = this._pieces[i];
      if (currentPiece.nodeIndex >= piece.nodeIndex) {
        break;
      } else {
        // piece.length는 piece.text.length와 같다.
        offsetBeforeNode += currentPiece.length;
        if (i === 0) {
          offsetBeforeNode += currentPiece.paddingLeft;
        }
      }
    }

    const offsetBeforeWordInNode = (this.range.startOffset + this._pieces[0].paddingLeft) - offsetBeforeNode;
    if (offsetBeforeWordInNode <= 0) {
      return 0;
    }

    const words = (piece.node.nodeValue || '').split(TTSUtil.getSplitWordRegex());
    let currentWordStartOffset = 0;
    for (let j = 0; j < words.length; j++) {
      if (currentWordStartOffset >= offsetBeforeWordInNode) {
        return j;
      }
      currentWordStartOffset += (words[j].length + 1);
    }
    return words.length - 1;
  }

  /**
   * @returns {Number}
   */
  getEndWordIndex() {
    const piece = this.getEndWordPiece();
    const firstPaddingLeft = this._pieces[0].paddingLeft;
    let offsetBeforeNode = 0;

    for (let i = 0; i < this._pieces.length; i++) {
      const currentPiece = this._pieces[i];
      if (currentPiece.nodeIndex >= piece.nodeIndex) {
        break;
      } else {
        // piece.length는 piece.text.length와 같다.
        offsetBeforeNode += currentPiece.length;
        if (i === 0) {
          offsetBeforeNode += firstPaddingLeft;
        }
      }
    }

    // SP = this._pieces[0], EP = Last Word Piece
    // |---------------|text (Other Pieces)|----text (EP)-------|paddingRight(EP)|
    // |-----------------------------------|--------node.nodeValue (EP)----------|
    // |paddingLeft(SP)|--------------endOffset-------------|--------------------|
    // |-----------------------------------------|-End Word-|--------------------|
    //
    // SP = EP일 때
    // |-----------node.nodeValue -----------------------------------------------|
    // |--paddingLeft--|---------endOffset / text-----------|---paddingRight-----|
    // |-----------------------------------------|-End Word-|--------------------|
    const offsetAfterEndWordInNode = (this.range.endOffset + firstPaddingLeft) - offsetBeforeNode;

    const words = (piece.node.nodeValue || '').split(TTSUtil.getSplitWordRegex());
    let currentWordEndOffset = 0;
    for (let j = 0; j < words.length; j++) {
      currentWordEndOffset += (words[j].length + 1);
      if (currentWordEndOffset >= offsetAfterEndWordInNode) {
        return j;
      }
    }
    return words.length - 1;
  }

  /**
   * @param {Boolean} removeBlank
   * @returns {MutableClientRect[]}
   */
  getClientRects(removeBlank) {
    const chunkRange = this.range;
    const pieces = this._pieces;
    const startPiece = this.getPiece(chunkRange.startOffset);
    let rects = [];
    let start = 0;
    let end = 0;
    let current = 0;
    let totalLength = 0;

    for (let i = 0; i < pieces.length; i += 1, current += totalLength) {
      const piece = pieces[i];
      const { node } = piece;
      let string = null;

      const range = document.createRange();
      range.selectNode(node);
      if (piece.isInvalid()) {
        totalLength = 0;
        rects.push(range.getAdjustedBoundingClientRect());
      } else {
        totalLength = piece.length;

        const pieceRange = new TTSRange(current, current + piece.length);
        if (chunkRange.startOffset <= pieceRange.startOffset) {
          if (pieceRange.endOffset <= chunkRange.endOffset) {
            // Case 1
            //   Chunk |        |
            //   Piece |   |
            //   Piece   |   |
            //   Piece     |    |
            start = pieceRange.startOffset;
            end = pieceRange.endOffset;
          } else if (chunkRange.endOffset <= pieceRange.startOffset) {
            // Case 2
            //   Chunk |   |
            //   Piece        |    |
            continue;
          } else {
            // Case 3
            //   Chunk |     |
            //   Piece    |       |
            start = pieceRange.startOffset;
            end = chunkRange.endOffset;
          }
        } else if (chunkRange.endOffset <= pieceRange.endOffset) {
          // Case 4
          //   Chunk    |   |
          //   Piece |          |
          //   Piece   |    |
          start = chunkRange.startOffset;
          end = chunkRange.endOffset;
        } else if (pieceRange.endOffset <= chunkRange.startOffset) {
          // Case 5
          //   Chunk         |   |
          //   Piece |    |
          continue;
        } else {
          // Case 6
          //   Chunk     |       |
          //   Piece |      |
          start = chunkRange.startOffset;
          end = pieceRange.endOffset;
        }

        start = Math.max((start - current) + piece.paddingLeft, 0);
        end = Math.max((end - current) + piece.paddingLeft, 0);
        if (end === 0) {
          end = totalLength;
        }
        for (;;) {
          try {
            range.setStart(node, start);
            range.setEnd(node, end);
            range.expand('character');
          } catch (e) {
            /* eslint-disable no-console */
            console.error(
              `TSChunk:getClientRects() Error!! ${e.toString()}\n`
            + ` => {startOffset: ${start}`
            + `, endOffset: ${end}`
            + `, offset: ${current}`
            + `, nodeIndex: ${piece.nodeIndex}`
            + `, startWordIndex: ${piece.startWordIndex}`
            + `, endWordIndex: ${piece.endWordIndex}}`);
          }

          // 앞뒤 여백을 없애서 하이라이트를 이쁘게 만들어보자.
          string = range.toString();
          if (startPiece.nodeIndex === piece.nodeIndex &&
            (string.match(TTSUtil.getWhitespaceAndNewLineRegex('^', null, 'g')) !== null ||
            string.match(TTSUtil.getSentenceRegex('^', null, 'g')) !== null)) {
            if (totalLength < start + 1) {
              break;
            }
            start += 1;
          } else if (string.match(TTSUtil.getWhitespaceAndNewLineRegex(null, '$', 'g')) !== null) {
            if (end - 1 < 0) {
              break;
            }
            end -= 1;
          } else {
            break;
          }
        } // end while

        if (removeBlank === true && string.length === 0) {
          continue;
        }

        rects = _Util.concatArray(rects, range.getAdjustedClientRects());
      }
    }// end for
    return rects;
  }

  /**
   * @param {TTSRange} range
   * @returns {TTSChunk}
   */
  copy(range) {
    return new TTSChunk(this._pieces, range);
  }
}
