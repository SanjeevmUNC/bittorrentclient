import * as tracker from "./tracker.js";
import ParseTorrent from "parse-torrent";
import fs from "fs";

let torrent = await ParseTorrent(fs.readFileSync('./slacko64-7.0.iso.torrent'))

tracker.getPeers(torrent, peers => {
  console.log('list of peers: ', peers);
});

