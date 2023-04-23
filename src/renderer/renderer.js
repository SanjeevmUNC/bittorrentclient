    
async function updateTable(table) {
    //Updates Client with files uploaded from other users.
    // Files that have been added or had there data updated are handled here
    var infoToUpdate = await window.electronAPI.dataForceUpdate()
    table.updateOrAddData(infoToUpdate);
    

}

window.electronAPI.dataRetrival((event, data) => {
    //Every Time Main sends dataRetrivial to Renderer, update the table to reflect changes
    table.updateOrAddData(data)
})

window.addEventListener("load", async function() {
    const upload = document.getElementById('upload')
    const delete_ = document.getElementById('delete')
    const pause = document.getElementById('pause')
    const resume = document.getElementById('resume')
    const download = document.getElementById('download')

    //var tableData = () => {window.electronAPI.dataRetrival()};

    let tableData = [
        {"id": "1", "name": "Some File", "size": "10 Mb", "progress": "53", "status": "Downloading", "eta": "37 mins", "seeds": "6", "peers": "10", "uploadSpeed": "---", "downloadSpeed": "1 Mb/s", "availability": 100.00},
        {id: 2, name: "Some Other File", size: "13 Mb", progress: 100, status: "Seeding", eta: "---", seeds: 6, peers: 10, uploadSpeed: "1 Mb/s", downloadSpeed: "---", availability: 53.45},
    ]
    
    var table = new Tabulator("#DownloadTable", {
        height: "97%",
        data: tableData,
        layout: "fitColumns",
        renderHorizontal: "virtual",
        moveableRows: true,
        groupBy:"status",
        selectable: 1,
        groupValues: [["Seeding", "Downloading", "Available", "Paused", "Completed"]], //Added download pause and completed
        columns:[
            {title: "Name", field:"name", width:250},
            {title: "Size", field:"size", hozAlign:"center"},
            {title: "Progress", field:"progress", formatter:"progress"},
            {title: "Status", field:"status", hozAlign:"center"},
            {title: "ETA", field: "eta", hozAlign:"center"},
            {title: "Seeds", field: "seeds", hozAlign:"center"},
            {title: "Peers", field: "peers", hozAlign:"center"},
            {title: "Upload Speed", field: "uploadSpeed", hozAlign:"center"},
            {title: "Download Speed", field: "downloadSpeed", hozAlign:"center"},
            {title: "Availability", field: "availability", hozAlign: "center"},
        ],
    });

    table.on("rowClick", function(e, row){
        selectedFile = row; //Saves pointer to row; use selecedFile.getData().x to access fields 
        //debugging
        for (var key in selectedFile.getData()) {
            console.log(selectedFile.getData()[key]);
        }
    })


    //Event Listeners for the header buttons
    //If (x) Structure to ensure that the element was loaded in correctly during above listener
    
    if (download) {
        upload.addEventListener('click', async () => {
            if (selectedFile === undefined) {
                this.alert("Cannot remove seeding file: no file is selected. Please click on a file that you are seeding that you wish to stop seeding.");
            }
            if (selectedFile.getData().status === "Available") {
                try{
                    const downloadDialogSucc = await this.window.electronAPI.downloadFile();
                    if(!downloadDialogSucc) {
                        this.alert("Download Failed: Please Try again")
                    } else {
                        console.log(downloadDialogSucc)
                    }
                } catch (err) {
                    console.log(err)
                }
            }
            
        })

    } else {
        console.log("Header Rendering Issue: Download Button was not loaded in before Listener was Assigned")
    }


    if (upload) {
        upload.addEventListener('click', async () => {
            //Sends Two way protocal to Main.js. If unsuccessful, receives the promise var
            // to alert user that something went wrong. Else procedes as normal
            const fileDialogSucc = await window.electronAPI.upload()
            if (!fileDialogSucc) {
                this.alert("Upload Failed: Please Try again")
            }
          });
    } else {
        console.log("Header Rendering Issue: Upload Button was not loaded in before Listener was Assigned")
    }

    if (delete_) {
        //On Click with Highlighted files sends signal to remove a file the user is seeding
        delete_.addEventListener('click', async () => {
            if (selectedFile === undefined) {
                this.alert("Cannot remove seeding file: no file is selected. Please click on a file that you are seeding that you wish to stop seeding.");
            }
            if (selectedFile.getData().status === "Seeding") {
                try{
                    successful = await window.electronAPI.removeSeed(1) // TODO: Replace once we figure out file commuication
                    if (successful) {
                        table.deleteRow(selectedFile.getData().id);
                        selectedFile = null;
                    }
                }
                catch (err) {
                    console.log(err)
                }
            }
            else {
                alert("Cannot remove seeding file: file selected is not file being seeded by user. Please click on a file that you are seeding that you wish to stop seeding.");
            }
        });
    } else {
        console.log("Header Rendering Issue: Remove Button was not loaded in before Listener was Assigned")
    }

    if (pause) {
        pause.addEventListener('click', async () => {
            if (selectedFile === undefined) {
                this.alert("Cannot pause download: no file is selected. Please click on a file that you are downloading to pause it.");
            }
            if (selectedFile.getData().status === "Downloading") {
                try{
                    file = await window.electronAPI.pauseFile(1) // Replace once we figure out file commuication
                    if (file) {
                        table.update([{name: file,}]) // Pass info to convey update to 
                    }
                }
                catch (err) {
                    console.log(err)
                }
            }
            else {
                alert("Cannot remove seeding file: file selected is not file being seeded by user. Please click on a file that you are seeding that you wish to stop seeding.");
            }
        });
            
    } else {
        console.log("Header Rendering Issue: Pause Button was not loaded in before Listener was Assigned")
    }
    
    if (resume){
        resume.addEventListener('click', async () => {
            if (selectedFile === undefined) {
                this.alert("Cannot pause download: no file is selected. Please click on a file that you are downloading to pause it.");
            }
            if (selectedFile.getData().status === "Paused") {
                try{
                    file = await window.electronAPI.resumeFile(1) // Ca;; to 
                    if (file) {
                        table.update([{name: file, status: "downloading"}]);
                    }
                }
                catch (err) {
                    console.log(err)
                }
            }
            else {
                alert("Cannot remove seeding file: file selected is not file being seeded by user. Please click on a file that you are seeding that you wish to stop seeding.");
            }
        })
    } else {
        console.log("Header Rendering Issue: Resume Button was not loaded in before Listener was Assigned")
    }
})



