import net from "net";
import { getPeers } from "./tracker.js";
import "./message.js"
import { queue } from "./queue.js";
import fs from "fs"
import { Pieces } from "./pieces.js";
import { Buffer } from "buffer";

export function startDownload(torrent, path) {
  getPeers(torrent, peers => {
    const p = new Pieces(torrent);
    const file = fs.openSync(path, 'w');
    peers.forEach(peer => download(peer, torrent, p, file));
  });
};

function download(peer, torrent, pieces, file) {
  const socket = new net.Socket({writeable: true})
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
    socket.write(buildHandshake(torrent));
  });
  const q = new queue(torrent);
  onFullMessage(socket, message => messageHandler(message, socket, pieces, q, torrent, file));
  socket.end()
}

function onFullMessage(socket, callback) {
  const savedBuffer = Buffer.alloc(0);
  const handshake = true;
  socket.on('data', receivedBuffer => {
    // messageLen calculates the length of a whole message
    const messageLen = () => handshake ? savedBuffer.readUInt8(0) + 49 : savedBuffer.readInt32BE(0) + 4;
    savedBuffer = Buffer.concat([savedBuffer, receivedBuffer]);

    while (savedBuffer.length >= 4 && savedBuffer.length >= messageLen()) {
      callback(savedBuffer.Uint8Array.prototype.slice(0, messageLen()));
      savedBuffer = savedBuffer.Uint8Array.prototype.slice(messageLen());
      handshake = false;
    }
  });
}

function messageHandler(message, socket, pieces, queue, torrent, file) {
  if (isHandshake(message)) {
    socket.write(buildInterested());
  } else {
    const m = parse(message);

    if (m.id === 0) chokeHandler(socket);
    if (m.id === 1) unchokeHandler(socket, pieces, queue);
    if (m.id === 4) haveHandler(socket, pieces, queue, m.payload);
    if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload);
    if (m.id === 7) pieceHandler(socket, pieces, queue, torrent, file, m.payload);
  }
}

function chokeHandler(socket) { 
  socket.end()
}

function unchokeHandler(socket, pieces, queue) {
  queue.choked = false;
  requestPiece(socket, pieces, queue);
}


function haveHandler(socket, pieces, queue, payload) { 
  const pieceIndex = payload.readUInt32BE(0);
  const queueEmpty = queue.length === 0;
  queue.queue(pieceIndex);
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

function bitfieldHandler(socket, pieces, queue, payload) { 
  const queueEmpty = queue.length === 0;
  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2) queue.queue(i * 8 + 7 - j);
      byte = Math.floor(byte / 2);
    }
  });
  if (queueEmpty) requestPiece(socket, pieces, queue);
 }

function pieceHandler(socket, pieces, queue, torrent, file, pieceResp) {
  console.log(pieceResp);
  pieces.addReceived(pieceResp);

  const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
  fs.write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => {});

  if (pieces.isDone()) {
    console.log('DONE!');
    socket.end();
    try { fs.closeSync(file); } catch(e) {}
  } else {
    requestPiece(socket, pieces, queue);
  }
}

function requestPiece(socket, pieces, queue) {
  if (queue.choked) return null;

  while (queue.length()) {
    const pieceBlock = queue.deque();
    if (pieces.needed(pieceBlock)) {
      socket.write(buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      break;
    }
  }
}

function isHandshake(message) {
  return message.length === message.readUInt8(0) + 49 &&
         message.toString('utf8', 1) === 'BitTorrent protocol';
}