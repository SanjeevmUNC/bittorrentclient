/**
Opens the torrent file
 */

'use strict';

const fs = require('fs');
const bencode = require('bencode');
const tracker = require('./tracker');

const torrent = bencode.decode(fs.readFileSync('puppy.torrent'));

tracker.getPeers(torrent, peers => {
  console.log('list of peers: ', peers);
});

/** ERROR: can't get the torrent to open */

/** the code above the announce property that is outputted
 *  is the location of the torrent's tracker 
 *  you have to use the UDP protocol and not the http because all new torrents are using UDP
 *  why UDP? udp replaces TCP -- tcp gurantees that when a user sends data, the other user will recieve that data
 * in it's entirety but must create a persistent connection
 * udp is a good choice for trackers bc they send small messages
 * TCP can be used when we actually transfer files between peers because they must arrive intact
 * */

/** I updated the Bencode stuff */


/* dgram module is module for udp, socket is an object where network communication can happen. we pass argument udp4 which means we want to use the noraml 4-byte IPv4 address format. can also pass newer 
udp6 but that's rarely used*/

/* message must be sent as a buffer through a socket*/

/** this returns a buffer, which represents a sequence of raw bytes */
/** the output is presented in bencode, which is a data serialization format */

