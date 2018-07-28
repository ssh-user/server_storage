/**
 * Create application menu.
 * @param {*} app 
 * @param {*} Menu 
 * @param {*} mainWindow 
 */
module.exports.CreateAppMenu = function CreateAppMenu(app, Menu, mainWindow) {
    const template = [
        {
            label: "App",
            submenu: [
                {
                    label: 'Exit',
                    click() {
                        app.quit()
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'toggle public',
                    click() {
                        mainWindow.webContents.send('toggle_public');
                    }
                },
                {
                    label: 'toggle private',
                    click() {
                        mainWindow.webContents.send('toggle_private');
                    }
                }
            ]
        },
        {
            label: "Configuration",
            submenu: [
                {
                    label: "config",
                    click() {
                        mainWindow.webContents.send('show_config');
                    }
                }
            ]
        },
        {
            label: "Info"
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};