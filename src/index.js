const { app, BrowserWindow, Menu } = require('electron');

// application menu, like FILE, HELP, ABOUT and other.
const { CreateAppMenu } = require("./server/menu.js");

// import engine to control SSH2 and ipc.
const { Engine } = require("./server/engine");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
// no sence in it, but let it be.
let engine = null;

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 900,
        height: 500,
        minHeight: 500,
        minWidth: 450
    });

    // create application menu like: File, Help and other.
    CreateAppMenu(app, Menu, mainWindow);

    // start engine and subscribe to some ipc events.
    engine = new Engine(mainWindow);

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    mainWindow.webContents.on("will-navigate", (event) => event.preventDefault());

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});