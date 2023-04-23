const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { getWindowSettings, saveBounds } = require("./src/settings");


//Handler functions for IPC Structure
//For functions that causes the CRUD table operations of create, read, or update, call handleDataRetrivial() at end
//To push updates to the table
async function handleUpload() {
    const {canceled, filePaths} = await dialog.showOpenDialog({
        filters:[
            { name: 'Torrent File', extensions: ['torrent'] },]
    })
    if (canceled) {
        return undefined
    } else {
        return filePaths[0] //replace with calling torrent.upload
    }
}


async function handleDownloadFile(info) {

    //info.properties.onProgress = status => window.webContents.send("download progress", status); //Sends Progress of Download
    //download(BrowserWindow.getFocusedWindow(), info.url, info.properties)
       // .then(dl => window.webContents.send('download complete', dl.getSavePath()))
}

async function handlePauseFile(file) {
    //Pauses a file that the user is currently downloading

    //used pass file name to locate pieces of file
    //pause the download
    //write update to JSON containing files in circulation that download is paused for user
    //if succ, return file name
    return file
}

async function handleRemoveSeed(file) {
    //attempts to remove a file a user is seeding

    //Run protocal to remove a user seed from connection
    //Update it for everyone else in connection -> handleNonUserRemoveSeed()
    //Push changes to JSON file so new users connecting to client do not see old seed file
    //if successful, return file name so file can be deleted for all users
    return file

}

async function handleNonUserRemoveSeed() {
    //Removes a file another user is seeding

    //Proc by handleRemoveSeed, pushes the removal of a seed file to 
}

async function handleResumeFile(file){
    //resumes downloading of a Paused File

    //
    if (file) {
        return
        //run hand
    }
    //replace with look up to see if user is downloading current file already
    if (1) {
        return
    }
    //run pause command to 
}



async function handleDataRetrival() {
    //Handles realtime updating of the display table in Renderer.js
    //Passes JSON elements that are either newly added or has been updated since last push (EX. Progress bars)
    let tableData = [
        {id: 1, name: "Some File", size: "10 Mb", progress: 53, status: "Downloading", eta: "37 mins", seeds: 6, peers: 10, uploadSpeed: "---", downloadSpeed: "1 Mb/s"},
        {id: 2, name: "Some Other File", size: "13 Mb", progress: 100, status: "Seeding", eta: "---", seeds: 6, peers: 10, uploadSpeed: "1 Mb/s", downloadSpeed: "---"},
    ] //replace with way to get current info on data being exchange
    mainWindow.webContents.send('dataRetrivial', tableData);
}

function handleDataLoadIn() {
    //find files currently in the P2P system upon boot up and send them
    //to Renderer via the dataRetrivial protocal

    let tableData = "" //replace with way to get initial JSON
    mainWindow.webContents.send('dataRetrivial', tableData);
}

//prevent trash clean up from erasing window
let mainWindow;


function createWindow () {
  const bounds = getWindowSettings();

  const mainWindow = new BrowserWindow({
    width: bounds[0],
    height: bounds[1],
    maximized: false,
    title: "VPBittorrent",
    icon: 'src/assets/icon.png',
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, './src/preload.js')
    }
  })

  
  mainWindow.on("resized", () => saveBounds(mainWindow.getSize()));
  //Enable Dev tools, remove when final 
  let wc = mainWindow.webContents;
  wc.openDevTools({ mode: "undocked" });

  //Load HTML
  mainWindow.loadFile('./src/renderer/index.html')

}



app.whenReady().then(() => {
  // Add one way listeners (on/send) from Renderer to Main

  // Add one way listerners (on/send) from Main to Renderer


  // Add two way listeners (invoke/handle)
  ipcMain.handle('dialog:upload', handleUpload)
  ipcMain.handle('dialog:downloadFile', handleDownloadFile);
  ipcMain.handle('dialog:pauseFile', handlePauseFile);
  ipcMain.handle('dialog:resumeFile', handleResumeFile);
  ipcMain.handle('dialog:removeSeed', handleRemoveSeed);
  
  createWindow()
  
  //Set interverval for consisitant realtime updating of the display table
  //setInterval(handleDataRetrival)
  

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})