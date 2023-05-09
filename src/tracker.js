<<<<<<< HEAD
import dgram from "dgram";
import Buffer from "buffer" 
import crypto from "crypto";
import * as util from "../util.js"
import { infoHash, size } from "./torrent-parser.js";

export function getPeers(torrent, callback) {
  const socket = dgram.createSocket('udp4');
  socket.bind();

  let url = new URL(torrent.announce[0]);
  console.log(torrent.announce)

  udpSend(socket, buildConnReq(), url);
  
  socket.on('listening', () => {
    const address = socket.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });

  socket.on('error', (err) => {
    console.error(`server error:\n${err.stack}`);
    socket.close();
  });

  socket.on('message', (response, rinfo) => {
    console.log(`got: ${response} from ${rinfo.address}:${rinfo.port}`);
    if (respType(response) === 'connect') {
      const connResp = parseConnResp(response);
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === 'announce') {
      const announceResp = parseAnnounceResp(response);
      callback(announceResp.peers);
    } else {
      console.log("Hit else");
    }
  });
};

function udpSend(socket, message, rawurl, callback=()=>{}) {
  socket.send(message, 0, message.length, rawurl.port, rawurl.hostname, callback);
}

function buildConnReq() {
  const buffer = Buffer.Buffer.alloc(16); 
  buffer.writeUInt32BE(0x417, 0); 
  buffer.writeUInt32BE(0x27101980, 4);
  buffer.writeUInt32BE(0, 8); 
  crypto.randomBytes(4).copy(buffer, 12); 
  console.log(buffer)
  return buffer;
}

function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8)
  }
}

function parseAnnounceResp(resp) {
  // GOING TO REFACTOR
  function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map(address => {
      return {
        ip: address.slice(0, 4).join('.'),
        port: address.readUInt16BE(4)
      }
    })
  }
}

export function respType(resp) {
  const action = resp.readUInt32BE(0);
  if (action === 0) return 'connect';
  if (action === 1) return 'announce';
}

function buildAnnounceReq(connId, torrent, port=6881) {
  const buffer = Buffer.Buffer.allocUnsafe(98);
  // connection id
  connId.copy(buffer, 0);
  // action
  buffer.writeUInt32BE(1, 8);
  // transaction id
  crypto.randomBytes(4).copy(buffer, 12);
  // info hash
  infoHash(torrent).copy(buffer, 16);
  // peerId
  util.genId().copy(buffer, 36);
  // downloaded
  Buffer.Buffer.alloc(8).copy(buffer, 56);
  // left
  size(torrent).copy(buffer, 64);
  // uploaded
  Buffer.Buffer.alloc(8).copy(buffer, 72);
  // event
  buffer.writeUInt32BE(0, 80);
  // ip address
  buffer.writeUInt32BE(0, 80);
  // key
  crypto.randomBytes(4).copy(buffer, 88);
  // num want
  buffer.writeInt32BE(-1, 92);
  // port
  buffer.writeUInt16BE(port, 96);
  return buffer;
=======
'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');
const torrentParser = require('./torrent-parser');
const util = require('./util');

module.exports.getPeers = (torrent, callback) => {
  const socket = dgram.createSocket('udp4');
  const url = torrent.announce.toString('utf8');

  // 1. send connect request
  udpSend(socket, buildConnReq(), url);

  socket.on('message', response => {
    if (respType(response) === 'connect') {
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === 'announce') {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  });
};

function udpSend(socket, message, rawUrl, callback=()=>{}) {
  const url = urlParse(rawUrl);
  socket.send(message, 0, message.length, url.port, url.hostname, callback);
}

function respType(resp) {
  const action = resp.readUInt32BE(0);
  if (action === 0) return 'connect';
  if (action === 1) return 'announce';
}

function buildConnReq() {
  const buf = Buffer.allocUnsafe(16);

  // connection id
  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);
  // action
  buf.writeUInt32BE(0, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
}

function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8)
  }
}

function buildAnnounceReq(connId, torrent, port=6881) {
  const buf = Buffer.allocUnsafe(98);

  // connection id
  connId.copy(buf, 0);
  // action
  buf.writeUInt32BE(1, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);
  // info hash
  torrentParser.infoHash(torrent).copy(buf, 16);
  // peerId
  util.genId().copy(buf, 36);
  // downloaded
  Buffer.alloc(8).copy(buf, 56);
  // left
  torrentParser.size(torrent).copy(buf, 64);
  // uploaded
  Buffer.alloc(8).copy(buf, 72);
  // event
  buf.writeUInt32BE(0, 80);
  // ip address
  buf.writeUInt32BE(0, 84);
  // key
  crypto.randomBytes(4).copy(buf, 88);
  // num want
  buf.writeInt32BE(-1, 92);
  // port
  buf.writeUInt16BE(port, 96);

  return buf;
}

function parseAnnounceResp(resp) {
  function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map(address => {
      return {
        ip: address.slice(0, 4).join('.'),
        port: address.readUInt16BE(4)
      }
    })
  }
>>>>>>> main
}