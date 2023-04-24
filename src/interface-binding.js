import os from "os"

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




