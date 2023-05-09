<<<<<<< HEAD
import Buffer from "buffer"
import { infoHash } from "./torrent-parser.js";
import { genId } from "../util.js";

export function buildHandshake(torrent) {
  const buffer = Buffer.Buffer.alloc(68);
  // pstrlen
  buffer.writeUInt8(19, 0);
  // pstr
  buffer.write('BitTorrent protocol', 1);
  // reserved
  buffer.writeUInt32BE(0, 20);
  buffer.writeUInt32BE(0, 24);
  // info hash
  infoHash(torrent).copy(buffer, 28);
  // peer id
  genId().copy(buffer, 48);
  console.log(buffer + " Handshake")
  return buffer;
};

export function buildKeepAlive() {
  Buffer.Buffer.alloc(4);
} 

export function buildChoke() {
  const buffer = Buffer.Buffer.alloc(5);
  // length
  buffer.writeUInt32BE(1, 0);
  // id
  buffer.writeUInt8(0, 4);
  return buffer;
};

export function buildUnchoke() {
  const buffer = Buffer.Buffer.alloc(5);
  // length
  buffer.writeUInt32BE(1, 0);
  // id
  buffer.writeUInt8(1, 4);
  return buffer;
};

export function buildInterested() {
  const buffer = Buffer.Buffer.alloc(5);
  // length
  buffer.writeUInt32BE(1, 0);
  // id
  buffer.writeUInt8(2, 4);
  return buffer;
};

export function buildUninterested() {
  const buffer = Buffer.Buffer.alloc(5);
  // length
  buffer.writeUInt32BE(1, 0);
  // id
  buffer.writeUInt8(3, 4);
  return buffer;
};

export function buildHave(payload) {
  const buffer = Buffer.Buffer.alloc(9);
  // length
  buffer.writeUInt32BE(5, 0);
  // id
  buffer.writeUInt8(4, 4);
  // piece index
  buffer.writeUInt32BE(payload, 5);
  return buffer;
};

export function buildBitfield(bitfield) {
  const buffer = Buffer.Buffer.alloc(14);
  // length
  buffer.writeUInt32BE(payload.length + 1, 0);
  // id
  buffer.writeUInt8(5, 4);
  // bitfield
  bitfield.copy(buf, 5);
  return buf;
};

export function buildRequest(payload) {
  const buffer = Buffer.Buffer.alloc(17);
  // length
  buffer.writeUInt32BE(13, 0);
  // id
  buffer.writeUInt8(6, 4);
  // piece index
  buffer.writeUInt32BE(payload.index, 5);
  // begin
  buffer.writeUInt32BE(payload.begin, 9);
  // length
  buffer.writeUInt32BE(payload.length, 13);
  return buffer;
};

export function buildPiece(payload) {
  const buffer = Buffer.Buffer.alloc(payload.block.length + 13);
  // length
  buffer.writeUInt32BE(payload.block.length + 9, 0);
  // id
  buffer.writeUInt8(7, 4);
  // piece index
  buffer.writeUInt32BE(payload.index, 5);
  // begin
  buffer.writeUInt32BE(payload.begin, 9);
  // block
  payload.block.copy(buf, 13);
  return buf;
};

export function buildCancel(payload) {
  const buffer = Buffer.Buffer.alloc(17);
  // length
  buffer.writeUInt32BE(13, 0);
  // id
  buffer.writeUInt8(8, 4);
  // piece index
  buffer.writeUInt32BE(payload.index, 5);
  // begin
  buffer.writeUInt32BE(payload.begin, 9);
  // length
  buffer.writeUInt32BE(payload.length, 13);
  return buf;
};

export function buildPort(payload) {
  const buffer = Buffer.Buffer.alloc(7);
  // length
  buffer.writeUInt32BE(3, 0);
  // id
  buffer.writeUInt8(9, 4);
  // listen-port
  buffer.writeUInt16BE(payload, 5);
  return buf;
};

export function parseMessage(message) {
  const id = message.length > 4 ? message.readInt8(4) : null;
  let payload = message.length > 5 ? message.slice(5) : null;
  if (id === 6 || id === 7 || id === 8) {
    const rest = payload.slice(8);
    payload = {
      index: payload.readInt32BE(0),
      begin: payload.readInt32BE(4)
    };
    payload[id === 7 ? 'block' : 'length'] = rest;
  }

  return {
    size : message.readInt32BE(0),
    id : id,
    payload : payload
  }
=======
'use strict';

const Buffer = require('buffer').Buffer;
const torrentParser = require('./torrent-parser');
const util = require('./util');

module.exports.buildHandshake = torrent => {
  const buf = Buffer.alloc(68);
  // pstrlen
  buf.writeUInt8(19, 0);
  // pstr
  buf.write('BitTorrent protocol', 1);
  // reserved
  buf.writeUInt32BE(0, 20);
  buf.writeUInt32BE(0, 24);
  // info hash
  torrentParser.infoHash(torrent).copy(buf, 28);
  // peer id
  util.genId().copy(buf, 48);
  return buf;
};

module.exports.buildKeepAlive = () => Buffer.alloc(4);

module.exports.buildChoke = () => {
  const buf = Buffer.alloc(5);
  // length
  buf.writeUInt32BE(1, 0);
  // id
  buf.writeUInt8(0, 4);
  return buf;
};

module.exports.buildUnchoke = () => {
  const buf = Buffer.alloc(5);
  // length
  buf.writeUInt32BE(1, 0);
  // id
  buf.writeUInt8(1, 4);
  return buf;
};

module.exports.buildInterested = () => {
  const buf = Buffer.alloc(5);
  // length
  buf.writeUInt32BE(1, 0);
  // id
  buf.writeUInt8(2, 4);
  return buf;
};

module.exports.buildUninterested = () => {
  const buf = Buffer.alloc(5);
  // length
  buf.writeUInt32BE(1, 0);
  // id
  buf.writeUInt8(3, 4);
  return buf;
};

module.exports.buildHave = payload => {
  const buf = Buffer.alloc(9);
  // length
  buf.writeUInt32BE(5, 0);
  // id
  buf.writeUInt8(4, 4);
  // piece index
  buf.writeUInt32BE(payload, 5);
  return buf;
};

module.exports.buildBitfield = bitfield => {
  const buf = Buffer.alloc(bitfield.length + 1 + 4);
  // length
  buf.writeUInt32BE(payload.length + 1, 0);
  // id
  buf.writeUInt8(5, 4);
  // bitfield
  bitfield.copy(buf, 5);
  return buf;
};

module.exports.buildRequest = payload => {
  const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(6, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
};

module.exports.buildPiece = payload => {
  const buf = Buffer.alloc(payload.block.length + 13);
  // length
  buf.writeUInt32BE(payload.block.length + 9, 0);
  // id
  buf.writeUInt8(7, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // block
  payload.block.copy(buf, 13);
  return buf;
};

module.exports.buildCancel = payload => {
  const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(8, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
};

module.exports.buildPort = payload => {
  const buf = Buffer.alloc(7);
  // length
  buf.writeUInt32BE(3, 0);
  // id
  buf.writeUInt8(9, 4);
  // listen-port
  buf.writeUInt16BE(payload, 5);
  return buf;
};

module.exports.parse = msg => {
  const id = msg.length > 4 ? msg.readInt8(4) : null;
  let payload = msg.length > 5 ? msg.slice(5) : null;
  if (id === 6 || id === 7 || id === 8) {
    const rest = payload.slice(8);
    payload = {
      index: payload.readInt32BE(0),
      begin: payload.readInt32BE(4)
    };
    payload[id === 7 ? 'block' : 'length'] = rest;
  }

  return {
    size : msg.readInt32BE(0),
    id : id,
    payload : payload
  }
>>>>>>> main
};