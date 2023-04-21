import ParseTorrent from "parse-torrent";
import fs from "fs";
import { startDownload } from "./src/download.js";

// Will be user input in the final version
let torrent = await ParseTorrent(fs.readFileSync('./gimp-2.10.34-arm64.dmg.torrent'))

startDownload(torrent, torrent.info.name)


