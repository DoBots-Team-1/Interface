const {app, BrowserWindow, Menu, Tray} = require('electron')
const createWindow = () => {
    const win = new BrowserWindow({
        title:'Drone Mapping Interface',
        width: 1200,
        height: 600,
        'minWidth': 700,
        'minHeight': 500,
        // icon: './assets/images/logo.png',
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    // if (process.platform === 'darwin') {
    //     app.dock.setIcon('./assets/images/logo.png');
    // }

    setTimeout(() => {
        app.dock.bounce()
    }, 5000)

    win.loadFile('app/views/checklist.html').catch((e) => console.log(e.message))
}
const createMenu = () => {
    // try {
    //     let tray = new Tray('./assets/images/logo.png')
    // } catch (e) {
    //     console.log(e.message)
    // }
}
app.whenReady().then(() => {
    createMenu()
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
