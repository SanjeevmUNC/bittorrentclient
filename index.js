<<<<<<< HEAD
import ParseTorrent from "parse-torrent";
import fs from "fs";
import { startDownload } from "./src/download.js";

// Will be user input in the final version
let torrent = await ParseTorrent(fs.readFileSync('./gimp-2.10.34-arm64.dmg.torrent'))

startDownload(torrent, torrent.info.name)


=======
'use strict';

const download = require('./src/download');
const torrentParser = require('./src/torrent-parser');

const torrent = torrentParser.open(process.argv[2]);

download(torrent, torrent.info.name);
>>>>>>> main
