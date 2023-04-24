import net from "net";
import { getPeers } from "./tracker.js";
import * as msg from "./message.js"
import { Queue } from "./queue.js";
import fs from "fs"
import { Pieces } from "./pieces.js";
import { Buffer } from "buffer";
import { getInterfaceAddress, getBindIP } from "./interface-binding.js"

let paused = false;
let doneCounter = 0;

export function startDownload(torrent, path) {
  getPeers(torrent, peers => {
    const p = new Pieces(torrent);
    const file = fs.openSync(path, 'w');
    peers.forEach(peer => download(peer, torrent, p, file));
  });
  return;
};

export function stopDownload() {
  process.exit()
}

function download(peer, torrent, pieces, file) {
  const socket = new net.Socket({writeable: true})
  socket.on('error', console.log);

  if (getBindIP() == true) {
    // User input
    socket.connect({port: peer.port, host: peer.ip, localAddress: getInterfaceAddress('utun7')}, () => {
      socket.write(msg.buildHandshake(torrent));
    });
  } else {
    socket.connect({port: peer.port, host: peer.ip}, () => {
      socket.write(msg.buildHandshake(torrent));
    });
  }

  const queue = new Queue(torrent);
  onFullMessage(socket, message => messageHandler(message, socket, pieces, queue, torrent, file));
  return;
}

export function pauseDownload(socket) {
  paused = true;
  socket.write(msg.buildChoke())
  return;
}

export function resumeDownload(socket) {
  paused = false;
  socket.write(msg.buildUnchoke())
  return;
}

function onFullMessage(socket, callback) {
  let savedBuffer = Buffer.alloc(0);
  let handshake = true;

  socket.on('data', receivedBuffer => {
    const msgLen = () => handshake ? savedBuffer.readUInt8(0) + 49 : savedBuffer.readInt32BE(0) + 4;
    savedBuffer = Buffer.concat([savedBuffer, receivedBuffer]);

    while (savedBuffer.length >= 4 && savedBuffer.length >= msgLen()) {
      callback(savedBuffer.slice(0, msgLen()));
      savedBuffer = savedBuffer.slice(msgLen());
      handshake = false;
    }
  });
  return;
}

function messageHandler(message, socket, pieces, queue, torrent, file) {
  if (isHandshake(message)) {
    socket.write(buildInterested());
  } else {
    const m = msg.parseMessage(message);

    if (m.id === 0 && paused==false) chokeHandler(socket);
    if (m.id === 1 && paused==false) unchokeHandler(socket, pieces, queue);
    if (m.id === 4) haveHandler(socket, pieces, queue, m.payload);
    if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload);
    if (m.id === 7) pieceHandler(socket, pieces, queue, torrent, file, m.payload);
  }
  return;
}

function chokeHandler(socket) { 
  socket.end()
  return;
}

function unchokeHandler(socket, pieces, queue) {
  queue.choked = false;
  requestPiece(socket, pieces, queue);
  return;
}


function haveHandler(socket, pieces, queue, payload) { 
  const pieceIndex = payload.readUInt32BE(0);
  const queueEmpty = queue.length === 0;
  queue.queue(pieceIndex);
  if (queueEmpty) requestPiece(socket, pieces, queue);
  return;
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
  return;
}

function pieceHandler(socket, pieces, queue, torrent, file, pieceResp) {
  pieces.addReceived(pieceResp);

  const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
  fs.write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => {});

  if (pieces.isDone()) {
    console.log('DONE!');
    socket.end();
    incrementDoneCounter()
    console.log(doneCounter)
    try { fs.closeSync(file); } catch(e) {}
  } else {
    requestPiece(socket, pieces, queue);
  }

  pieces.printPercentDone()
  killTime()
  return;
}

function requestPiece(socket, pieces, queue) {
  if (queue.choked) return null;

  while (queue.length()) {
    const pieceBlock = queue.deque();
    if (pieces.needed(pieceBlock)) {
      socket.write(msg.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      break;
    }
  }
  return;
}

function isHandshake(message) {
  return message.length === message.readUInt8(0) + 49 &&
         message.toString('utf8', 1) === 'BitTorrent protocol';
}

export function incrementDoneCounter() {
  doneCounter += 1
}

async function killTime() {
  if (doneCounter>=0) {
    console.log('Cleaning up...')
    setTimeout(() => {
      process.exit()
    }, 15000);
  }
}