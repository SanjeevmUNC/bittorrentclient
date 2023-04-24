import os from "os"
import net from "net"
import * as msg from "./message.js"

// User toggle
let bindIPOn = false;

export function bindIP() {
  // Must be called prior to starting download or program must be restarted
  bindIPOn = true
}

export function getBindIP() {
  return bindIPOn
}

export function getInterfaceAddress(network_interface) {
  return os.networkInterfaces()[network_interface][0].address
}

export function dgramBind(socket, network_interface) {
  const address = getInterfaceAddress(network_interface)
  socket.bind({address: address})
  return
}

export function netBind(port, ip, network_interface, torrent) {
  var socket = net.createConnection({
    port: port,
    host: ip,
    localAddress: getInterfaceAddress(network_interface),
    writable: true
  }, () => {
    socket.write(msg.buildHandshake(torrent));
  });

  // const address = getInterfaceAddress(network_interface)
  // socket.connect(port, ip, address, () => {
  //   socket.write(msg.buildHandshake(torrent));
  // });
  return socket
} 



