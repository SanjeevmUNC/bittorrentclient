import { blocksPerPiece, BLOCK_LEN } from "./torrent-parser.js";

export class Pieces {
  constructor(torrent) {
    function buildPiecesArray() {
      const nPieces = torrent.info.pieces.length / 20;
      const arr = new Array(nPieces).fill(null);
      return arr.map((_, i) => new Array(blocksPerPiece(torrent, i)).fill(false));
    }

    this._requested = buildPiecesArray();
    this._received = buildPiecesArray();
    this._percentDone = 0;
  }

  addRequested(pieceBlock) {
    const blockIndex = pieceBlock.begin / BLOCK_LEN;
    this._requested[pieceBlock.index][blockIndex] = true;
  }

  addReceived(pieceBlock) {
    const blockIndex = pieceBlock.begin / BLOCK_LEN;
    this._received[pieceBlock.index][blockIndex] = true;
  }

  needed(pieceBlock) {
    if (this._requested.every(blocks => blocks.every(i => i))) {
      this._requested = this._received.map(blocks => blocks.slice());
    }
    const blockIndex = pieceBlock.begin / BLOCK_LEN;
    return !this._requested[pieceBlock.index][blockIndex];
  }

  isDone() {
    if (this._percentDone>=99.95) {
      return (this._percentDone>=99.95);
    } else {
      return false;
    }
  }

  printPercentDone() {
    const downloaded = this._received.reduce((totalBlocks, blocks) => {
      return blocks.filter(i => i).length + totalBlocks;
    }, 0);

    const total = this._received.reduce((totalBlocks, blocks) => {
      return blocks.length + totalBlocks;
    }, 0);

    const percent = Math.ceil((downloaded / total * 100)*100)/100;

    this._percentDone = percent;

    console.log('progress: ' + (Math.ceil(percent*10)/10) + '%\r');
  }
};