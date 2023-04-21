import ParseTorrent from "parse-torrent";
import fs from "fs";
import { startDownload } from "./src/download.js";

// Will be user input in the final version
let torrent = await ParseTorrent(fs.readFileSync('./slacko64-7.0.iso.torrent'))

startDownload(torrent, torrent.info.name)


