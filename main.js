const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { getWindowSettings, saveBounds } = require("./src/settings");
const db = require('electron-db');
const fs = require('fs');
//TODO: Change from module (require) to import. Can use VSCODE lightbulb to do it automatically
// const { buildCancel } = require('./src/message');
//const {startDownload, pauseDownload, resumeDownload} = require("./src/download.js");
//const ParseTorrent = require(ParseTorrent)


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
        fs.readFile(filePaths[0], 'utf-8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            var uploadFile = data //Send to backend
        })

        //Upload to table accurate for this seeder
        let stats = fs.statSync(filePaths[0])
        let fileSizeMBytes = (stats.size / (1024 * 1024)).toFixed(10);
        let name = path.basename(filePaths[0]);

        newFile = {name: name, file_name: filePaths[0], size: fileSizeMBytes + ' MB', progress: 100, status: "Seeding", eta: "---", seeds: 1, peers: 0, uploadSpeed: "---", downloadSpeed: "---"}
        db.insertTableContent('P2Pfiles', newFile, (succ, msg) => {
            // succ - boolean, tells if the call is successful
            console.log("Success: " + succ);
            console.log("Message: " + msg);
        })
    
        return -1 //dummy return to fulfil promise -> invoke is just easier to implentment 
    }
}

async function handleDownloadFile(file) {
    //file -> file path to be downloaded 
    try {
        //let torrent = await ParseTorrent(fs.readFileSync('file')) -> TODO: Uncomment once Change from require to ES6 import format
        //startDownload(torrent, torrent.info.name)
        let filestr = file //TODO: fix weird bug where instead of the name of the file, a long slew of stuff is returned instead
        console.log(file)
        //Update table
        let where = {
            "file_name": file
        }
        let set = {
            "status": "Downloading",
            "progress": 0
        }

        db.updateRow('P2Pfiles', where, set, (succ, msg) => {
            // succ - boolean, tells if the call is successful
            console.log("Success: " + succ);
            console.log("Message: " + msg);
        });

        return true
    } catch (e) {
        console.log(e)
        return false
    }

}

async function handlePauseFile(file) {
    //Pauses a file that the user is currently downloading

    //used pass file name to locate pieces of file
    //pause the download
    //write update to JSON containing files in circulation that download is paused for user
    //if succ, return file name
    try {
        //Call pause function from download.js
        //pauseDownload(file)
        let where = {
            "file_name": file
        }
        let set = {
            "status": "Paused",
        }

        db.updateRow('P2Pfiles', where, set, (succ, msg) => {
            // succ - boolean, tells if the call is successful
            console.log("Success: " + succ);
            console.log("Message: " + msg);
        });

    } catch (error) {
        console.log(error)
        return false
    }
    return file
}

async function handleRemoveSeed(file) {
    //attempts to remove a file a user is seeding

    //Run protocal to remove a user seed from connection
    //Update it for everyone else in connection -> handleNonUserRemoveSeed()
    //Push changes to JSON file so new users connecting to client do not see old seed file
    //if successful, return file name so file can be deleted for all users
    try {
        //buildCancel(file) => Cancel the building process for the seeded file

        db.deleteRow('P2Pfiles', {'file_name': file}, (succ, msg) => {
            console.log(msg)
        })
        return true

    } catch (error) {
        console.log(error)
        return false
    }
}

async function handleResumeFile(file){
    //resumes downloading of a Paused File
    
    try {

        //resumeDownload(file)
        let where = {
            "file_name": file
        }
        let set = {
            "status": "Downloading",
        }

        db.updateRow('P2Pfiles', where, set, (succ, msg) => {
            // succ - boolean, tells if the call is successful
            console.log("Success: " + succ);
            console.log("Message: " + msg);
        });

    } catch (error) {
        console.log(error)
        return false
    }
}

async function handleDataLoadIn() {
    //find files currently in the P2P system upon boot up and send them
    //to Renderer via the dataRetrivial protocal
    tabData = undefined
    if (db.valid('P2Pfiles')) {
        db.getAll('P2Pfiles', (succ, data) => {
            if (succ) {
                console.log("DB: Data load in values found")
                tabData = data
            } else {
                console.log("Error: Cannot load in data")
                return {}
            }
        })
    } else {
        console.log("Error: Database not found")
        return {}
    }
    return tabData // Do not ask me why it has to be like this. If I return within the if condition, it will only return an undefined value

}

//prevent trash clean up from erasing window
var mainWindow;


function createWindow () {
  const bounds = getWindowSettings();

  mainWindow = new BrowserWindow({
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
  ipcMain.handle('dialog:upload', handleUpload);
  ipcMain.handle('dialog:downloadFile', handleDownloadFile);
  ipcMain.handle('dialog:pauseFile', handlePauseFile);
  ipcMain.handle('dialog:resumeFile', handleResumeFile);
  ipcMain.handle('dialog:removeSeed', handleRemoveSeed);
  ipcMain.handle('data:dataLoadIn', handleDataLoadIn);

  createWindow()

  //JSON localstorage for files
  const dbLocation = path.join(__dirname, '')
  console.log(dbLocation)
  //succ is a bool promise callback regarding if table was successfully made 
  db.createTable("P2Pfiles", (succ, msg) => {
    if (succ) {
        console.log(msg)
    } else {
        console.log('Database Initialization Error. ' + msg)
    }
  })

  // TODO: load in initial P2P data here
  let tableData = [
    {name: "Some File", file_name: "/C/Fake", size: "10 Mb", progress: 53, status: "Downloading", eta: "37 mins", seeds: 6, peers: 10, uploadSpeed: "---", downloadSpeed: "1 Mb/s"},
    {name: "Some Other File", file_name: "/C/Fake", size: "13 Mb", progress: 100, status: "Seeding", eta: "---", seeds: 6, peers: 10, uploadSpeed: "1 Mb/s", downloadSpeed: "---"},
    {name: "Some Other File", file_name: "/C/Fake", size: "13 Mb", progress: 100, status: "Available", eta: "---", seeds: 6, peers: 10, uploadSpeed: "1 Mb/s", downloadSpeed: "---"}
    ]
    

  if (db.valid('P2Pfiles')) {
    for (entry in tableData){
        db.insertTableContent('P2Pfiles', tableData[entry], (succ, msg) => {
            // succ - boolean, tells if the call is successful
            console.log("Success: " + succ);
            console.log("Message: " + msg);
        })
    }
  }


  //Set interverval for consisitant realtime updating of the display table
  //setInterval(handleDataRetrival)
  

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
    db.clearTable("P2Pfiles", (succ, msg) => {
        if (succ) {
            console.log(msg)
        }
    })
    if (process.platform !== 'darwin') app.quit()
})