import Logger from './Logger';
import RectList from './RectList';
import SpeechRange from './SpeechRange';
import SpeechUtterance from './SpeechUtterance';
import SpeechUtil from './SpeechUtil';

/**
 * @class SpeechChunk
 * @private @property {SpeechPiece[]} _pieces
 * @private @property {SpeechRange} _range
 */
export default class SpeechChunk {
  /**
   * @returns {SpeechRange}
   */
  get range() { return this._range; }

  /**
   * @param {SpeechRange} newRange
   */
  set range(newRange) {
    if (newRange instanceof SpeechRange) {
      this._range = newRange;
    } else {
      this._range = new SpeechRange(0, this._fullText().length);
    }
  }

  /**
   * @returns {string}
   * @private
   */
  get _fullText() { return this._pieces.map(piece => piece.text).join(''); }

  /**
   * @returns {string}
   */
  get text() { return this._fullText().substring(this.range.startOffset, this.range.endOffset); }

  /**
   * @returns {SpeechUtterance}
   */
  get utterance() {
    return new SpeechUtterance(this.text)
      .removeNewLine()
      .removeSpecialCharacters(['≪', '≫'])
      .removeHanja()
      .removeLatin()
      .removeAllRepeatedCharacter(['<', '>', '_', '×'])
      .replaceTilde()
      .replaceNumeric()
      .replaceBracket()
      .replaceEqual()
      .replaceDate()
      .insertPauseTag();
  }

  /**
   * @param {SpeechPiece} pieces
   * @param {SpeechRange} range
   */
  constructor(pieces, range = null) {
    this._pieces = pieces;
    this.range = range;
  }

  /**
   * @param {number} offset
   * @returns {?SpeechPiece}
   * @private
   */
  _getPiece(offset) {
    let length = 0;
    return this._pieces.find((piece) => {
      length += piece.length;
      return offset <= length;
    });
  }

  /**
   * @param {SpeechPiece} piece
   * @returns {number}
   * @private
   */
  _getOffset(piece) {
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
   * @returns {?SpeechPiece}
   */
  getStartWordPiece() {
    return this._getPiece(this.range.startOffset);
  }

  /**
   * @returns {?SpeechPiece}
   */
  getEndWordPiece() {
    return this._getPiece(this.range.endOffset);
  }

  /**
   * @returns {?number}
   */
  getStartNodeIndex() {
    return this.getStartWordPiece().nodeIndex;
  }

  /**
   * @returns {?number}
   */
  getEndNodeIndex() {
    return this.getEndWordPiece().nodeIndex;
  }

  /**
   * @returns {number}
   */
  getStartWordIndex() {
    // start word piece === this._pieces[0]인 경우
    // |---------------||---- text of this._pieces[0] ----------------------
    // |--paddingLeft--||----this.startOffset-----||----Start Word-----||---
    // |-----------node.nodeValue of Start Word Piece-----------------------
    const piece = this.getStartWordPiece();
    let offsetBeforeNode = 0;

    for (let i = 0; i < this._pieces.length; i += 1) {
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

    const words = (piece.node.nodeValue || '').split(SpeechUtil.getSplitWordRegex());
    let currentWordStartOffset = 0;
    for (let j = 0; j < words.length; j += 1) {
      if (currentWordStartOffset >= offsetBeforeWordInNode) {
        return j;
      }
      currentWordStartOffset += (words[j].length + 1);
    }
    return words.length - 1;
  }

  /**
   * @returns {number}
   */
  getEndWordIndex() {
    const piece = this.getEndWordPiece();
    const firstPaddingLeft = this._pieces[0].paddingLeft;
    let offsetBeforeNode = 0;

    for (let i = 0; i < this._pieces.length; i += 1) {
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

    const words = (piece.node.nodeValue || '').split(SpeechUtil.getSplitWordRegex());
    let currentWordEndOffset = 0;
    for (let j = 0; j < words.length; j += 1) {
      currentWordEndOffset += (words[j].length + 1);
      if (currentWordEndOffset >= offsetAfterEndWordInNode) {
        return j;
      }
    }
    return words.length - 1;
  }

  /**
   * @param {boolean} removeBlank
   * @returns {RectList}
   */
  getRectList(removeBlank) {
    const chunkRange = this.range;
    const pieces = this._pieces;
    let rectList = new RectList();
    let start = 0;
    let end = 0;
    let current = 0;
    let totalLength = 0;

    for (let i = 0; i < pieces.length; i += 1, current += totalLength) {
      const piece = pieces[i];
      const { node } = piece;

      const range = document.createRange();
      range.selectNodeContents(node);
      if (piece.isInvalid()) {
        totalLength = 0;
        rectList.push(range.getBoundingClientRect().toRect());
      } else {
        totalLength = piece.length;

        const pieceRange = new SpeechRange(current, current + piece.length);
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
        try {
          range.setStart(node, start);
          range.setEnd(node, end);
          range.expand('character');
        } catch (e) {
          Logger.error(
            `SpeechChunk:getRectList() Error!! ${e.toString()}\n`
            + ` => {startOffset: ${start}`
            + `, endOffset: ${end}`
            + `, offset: ${current}`
            + `, nodeIndex: ${piece.nodeIndex}`
            + `, startWordIndex: ${piece.startWordIndex}`
            + `, endWordIndex: ${piece.endWordIndex}}`);
        }

        if (removeBlank === true && range.toString().length === 0) {
          continue;
        }

        rectList = rectList.concat(range.getClientRects().toRectList());
      }
    } // end for
    return rectList;
  }

  /**
   * @param {SpeechRange} range
   * @returns {SpeechChunk}
   */
  copy(range) {
    return new SpeechChunk(this._pieces, range);
  }
}
