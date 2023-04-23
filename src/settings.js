// Saves User Settings 
const Store = require("electron-store");
const storage = new Store();



function getWindowSettings () {
    const default_bounds = [800, 650];

    const size = storage.get("win-size");

    if (size) return size;
    else {
        storage.set("win-size", default_bounds);
        return default_bounds
    }
}

function saveBounds (bounds) {
    storage.set("win-size", bounds);
    
}

module.exports = {
    getWindowSettings: getWindowSettings,
    saveBounds: saveBounds
}