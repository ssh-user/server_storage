const { ipcMain, dialog, clipboard } = require('electron');
const { writeFileSync, readFileSync, stat, readdir } = require("fs");
const { join, sep } = require("path");
const { promisify } = require('util');
const mkdirp = require('mkdirp');

// convert to promise.
const mkdir = promisify(mkdirp);
const stats = promisify(stat);
const readdirAsync = promisify(readdir);

// connect SSH module.
const { SFTP } = require("./ssh");


// DEBUG. сделать индикацию, при попытке подключится к серверу, если кинута ошибка.
// переподключение каждую минуту.

// DEBUG. не скачивается пустая папка, просто игнорируется. 
// Связано с тем, что папки создаются через путь файла. А нет файла - нет пути.


module.exports.Engine = class Engine {
    constructor(mainWindow) {
        this.wc = mainWindow.webContents;
        this.ipc = ipcMain;

        // load config file.
        this.config = null;
        try {
            this.config = JSON.parse(readFileSync("config.json").toString());
        } catch (error) { };

        this.sftp = new SFTP(this.config);


        // subscribe to save config event (sync).
        this.ipc.on("save_config", this._saveConfig.bind(this));

        // subscribe to request config event (sync).
        this.ipc.on("config", this.getConfig.bind(this));

        // get list of public folder (async).
        this.ipc.on("public_list", this.getPublic.bind(this));

        // get list of private folder (async).
        this.ipc.on("private_list", this.getPrivate.bind(this));

        // event to download file\folder from remote server.
        this.ipc.on("download", this.download.bind(this));

        // event to upload file\folder to remote server.
        this.ipc.on("upload", this.upload.bind(this));

        // event to remove file\folder from remote server.
        this.ipc.on("remove", this.remove.bind(this));

        // get public link to download file from server.
        this.ipc.on("link", this.link.bind(this));
    };

    /**
     * Save new config.
     * @param {Event} e event.
     * @param {Object} config config file.
     */
    async _saveConfig(e, config) {
        try {
            // save config to filesystem.
            writeFileSync("config.json", JSON.stringify(config));
            e.returnValue = null;
            // DEBUG. инициализировать подключение к серверу с новым конфигом.
        } catch (error) {
            e.returnValue = error;
        };
    };

    /**
     * SYNC get a config.
     * @param { any } event Electron IPC event.
     */
    getConfig(event) {
        event.returnValue = this.config;
    };

    /**
     * Get public list of files and folders.
     * @param { Event } e event.
     * @param { String } path Remote server path to folder.
     */
    async getPublic(e, path = "/") {
        try {
            let list = await this.sftp.getFileList(join("public/", path));

            // prepare files to needed view.
            let result = list.map((elem) => {
                return {
                    name: elem.filename,
                    isFolder: elem.attrs.isDirectory(),
                    size: elem.attrs.size,
                    time: elem.attrs.mtime
                };
            });

            e.sender.send('public_list', result);
        } catch (error) {
            console.error(error);
        };
    };

    /**
     * Get private list of files and folders.
     * @param { Event } e event.
     * @param { String } path Remote server path to folder.
     */
    async getPrivate(e, path = "/") {
        try {
            let list = await this.sftp.getFileList(join("private/", path));

            // prepare files to needed view.
            let result = list.map((elem) => {
                return {
                    name: elem.filename,
                    isFolder: elem.attrs.isDirectory(),
                    size: elem.attrs.size,
                    time: elem.attrs.mtime
                };
            });

            e.sender.send('private_list', result);
        } catch (error) {
            console.error(error);
        };
    };

    /**
     * Download file\folder from remote server to user.
     * @param { Event } e event.
     * @param { Object } opt Options object.
     */
    download(e, opt) {
        // get target folder.
        dialog.showOpenDialog(
            {
                title: "Please, choose the place.",
                defaultPath: __dirname,
                properties: [
                    "openDirectory"
                ]
            },
            // callback.
            async (result) => {
                // if no folder selected nothing doing.
                if (!result) return;

                // get folder to save file(s).
                let folderToSave = result[0];

                if (opt.isFolder) {
                    // it's a folder.             
                    try {
                        // create paths.
                        let sourceFolder = join(opt.store, opt.path);
                        let fileList = await this.sftp.getFileNamesRecursive(sourceFolder);

                        // download files one-by-one.
                        for (const file of fileList) {

                            // get path from folder name to the end (at this moment with filename).
                            let folderPath = file.slice(file.search(opt.name) - 1);
                            // cut path to separate with PATH.SEP.
                            let temp = folderPath.split(sep);
                            // get file name.
                            let filename = temp[temp.length - 1];
                            // and last step, remove from "folderPath" filename.
                            folderPath = folderPath.replace(filename, "");

                            // now we have two variable (example):
                            // "folderPath" - "/test-folder/sub-folder/"
                            // "filename" - "test-file.txt"

                            // create folders on user pc.
                            await mkdir(join(folderToSave, folderPath));

                            // target path on user PC.
                            let target = join(folderToSave, folderPath, filename);

                            // send filename to FOOTER.
                            this.wc.send(
                                `${opt.store}_add_footer`,
                                {
                                    name: filename,
                                    type: "download",
                                    percent: 0
                                }
                            );

                            // need for a bit improve code. Send user only integer percent.
                            let prevValue = 0;

                            // download file with progress indication.
                            await this.sftp.downloadFile(file, target, (percent) => {
                                if (~~percent != prevValue) {
                                    prevValue = ~~percent;
                                    this.wc.send(
                                        `${opt.store}_update_footer`,
                                        {
                                            name: filename,
                                            type: "download",
                                            percent: prevValue
                                        }
                                    );
                                };
                            });
                        };

                        // send user success result.
                        this.wc.send("success", "Folder successfully download!");
                    } catch (error) {
                        // send user error.
                        // DEBUG. save error to log file.
                        this.wc.send("error", "Folder can't download!");
                    };
                } else {
                    // it is a file.
                    try {
                        // create paths.
                        let source = join(opt.store, opt.path);
                        let target = join(folderToSave, opt.name);

                        // send filename to FOOTER.
                        this.wc.send(
                            `${opt.store}_add_footer`,
                            {
                                name: opt.name,
                                type: "download",
                                percent: 0
                            }
                        );

                        // need for a bit improve code. Send user only integer percent.
                        let prevValue = 0;

                        // download file with progress indication.
                        await this.sftp.downloadFile(source, target, (percent) => {
                            if (~~percent != prevValue) {
                                prevValue = ~~percent;
                                this.wc.send(
                                    `${opt.store}_update_footer`,
                                    {
                                        name: opt.name,
                                        type: "download",
                                        percent: prevValue
                                    }
                                );
                            };
                        });

                        // send user success result.
                        this.wc.send("success", "File successfully download!");
                    } catch (error) {
                        console.error(error);
                        // send user error.
                        this.wc.send("error", "File can't download!");
                    };
                };
            }
        );
    };

    /**
     * Upload file\folder to remote server.
     * @param { Event } e event.
     * @param { {store:String, path:String} } store Options object. Contains path and store.
     */
    upload(e, store) {
        dialog.showOpenDialog({
            title: "Choose folder to upload",
            properties: ['openFile', 'openDirectory', 'multiSelections']
        }, async (result) => {
            // nothing doing if no file\folder chosen.
            if (!result) return;

            // upload all chosen files.
            for (let elem of result) {
                try {
                    // get element stats.
                    let elemStats = await stats(elem);

                    // it's folder.
                    if (elemStats.isDirectory()) {
                        /**
                         * Helper func. recursive iterate folder and collect all files.
                         * @param { String } sourceFolder path to parent folder.
                         * @returns { String[] } Array of file paths.
                         */
                        async function getFilesRecursive(sourceFolder) {
                            // get file list from remote server.
                            const subdirs = await readdirAsync(sourceFolder);

                            // iterate it and if it will be folder, not a file, start again.
                            const files = await Promise.all(subdirs.map(async (subdir) => {
                                let result = join(sourceFolder, subdir);

                                if ((await stats(result)).isDirectory()) {
                                    result = await getFilesRecursive.call(this, result);
                                };
                                return result;
                            }));

                            // concat all result to one array and return to user.
                            return files.reduce((target, sub) => target.concat(sub), []);
                        };

                        // get all files from folder.
                        let list = await getFilesRecursive(elem);

                        // upload files one-by-one.
                        for (const file of list) {

                            // to successfully upload fistly we should create folders on remote server.                            
                            // get name of root folder.
                            let temp = elem.split(sep);
                            let rootFolder = temp[temp.length - 1];
                            // get name of filename.
                            temp = file.split(sep);
                            let filename = temp[temp.length - 1];

                            // get only folders names without $home/username/.. and without filename.
                            // ex.  "/toUpload/folder1/sub/"
                            let foldersString = file.replace(filename, "");
                            foldersString = foldersString.slice(foldersString.search(rootFolder));

                            // create folders on remote server.
                            await this.sftp.createFolder(join(store.store, store.path), foldersString);

                            let target = join(store.store, store.path, foldersString, filename);

                            // send filename to FOOTER.
                            this.wc.send(
                                `${store.store}_add_footer`,
                                {
                                    name: filename,
                                    type: "upload",
                                    percent: 0
                                }
                            );

                            // need for a bit improve code. Send user only integer percent.
                            let prevValue = 0;

                            await this.sftp.uploadFile(file, target, (percent) => {
                                if (~~percent != prevValue) {
                                    prevValue = ~~percent;
                                    this.wc.send(
                                        `${store.store}_update_footer`,
                                        {
                                            name: filename,
                                            type: "upload",
                                            percent: prevValue
                                        }
                                    );
                                };
                            });
                        };
                    }
                    // it's file.
                    else if (elemStats.isFile()) {
                        // get filename.
                        let temp = elem.split(sep);
                        let filename = temp[temp.length - 1];

                        // create source and target.
                        let source = elem;
                        let target = join(store.store, store.path, filename);

                        // send filename to FOOTER.
                        this.wc.send(
                            `${store.store}_add_footer`,
                            {
                                name: filename,
                                type: "upload",
                                percent: 0
                            }
                        );

                        // need for a bit improve code. Send user only integer percent.
                        let prevValue = 0;

                        // upload file.
                        await this.sftp.uploadFile(source, target, (percent) => {
                            if (~~percent != prevValue) {
                                prevValue = ~~percent;
                                this.wc.send(
                                    `${store.store}_update_footer`,
                                    {
                                        name: filename,
                                        type: "upload",
                                        percent: prevValue
                                    }
                                );
                            };
                        });
                    };

                } catch (error) {
                    // send user error msg.
                    console.error(error);
                    // DEBUG. save error to log file.
                    this.wc.send("error", "Can't upload file(s).");
                };
            };

            // update user screen
            if (store.store == "public")
                this.wc.send("refresh_public");
            else if (store.store == "private")
                this.wc.send("refresh_private");

            // send user success result.
            this.wc.send("success", "All files successfully uploaded!");
        });
    };

    /**
     * Remove file\folder from remote server.
     * @param { Event } e event.
     * @param { {store:String, path:String, name:String, isFolder:Boolean} } obj Contain requiest info.
     */
    async remove(e, obj) {
        if (obj.isFolder) {
            // remove folder. it's a bit hard. Firstly should collect all files and remove them, 
            // then remove child folder and olny after this remove target folder.

            // get list of files from folder and sub-folders.
            let source = join(obj.store, obj.path);
            let files = await this.sftp.getFileNamesRecursive(source);

            // remove all files from server leave only folders.
            for (const file of files) {
                try {
                    await this.sftp.removeFile(file);
                } catch (error) {
                    // send user error msg.
                    // DEBUG. save error to log file.
                    this.wc.send("error", "Can't remove file.");
                };
            };

            // get array of folders.
            let folders = await this.sftp.getFolderNamesRecursive(source);

            // sort them. first should be most longest paths.
            folders = folders.sort((a, b) => {
                if (a.length > b.length) return -1;
                else return 1;
            });

            // add source folder to all folders.
            folders.push(source);

            // and now we can remove them all one-by-one.
            try {
                for (const path of folders) {
                    await this.sftp.removeDir(path);
                };
            } catch (error) {
                // send user error msg.
                // DEBUG. save error to log file.
                this.wc.send("error", "Can't remove folder.");
            };

            // update user screen
            if (obj.store == "public")
                this.wc.send("refresh_public");
            else if (obj.store == "private")
                this.wc.send("refresh_private");

        } else {
            // remove file. it's easy.
            try {
                let target = join(obj.store, obj.path);
                await this.sftp.removeFile(target);

                // update user screen
                if (obj.store == "public")
                    this.wc.send("refresh_public");
                else if (obj.store == "private")
                    this.wc.send("refresh_private");

            } catch (error) {
                // send user error msg.
                // DEBUG. save error to log file.
                this.wc.send("error", "Can't remove file.");
            };
        };

        // send user success msg.
        this.wc.send("success", "Remove successfully!");
    };

    /**
     * Get path to public file and copy link to clipboard.
     * @param { Event } e event.
     * @param { String } path path to file on server.
     */
    async link(e, path) {
        if (this.config) {
            let filepath = `${this.config.server}/${path}`;
            clipboard.writeText(filepath);

            // send user success msg.
            this.wc.send("success", "Link copied.");
        } else {
            // send user error msg.
            // DEBUG. save error to log file.
            this.wc.send("error", "Can't 'get link' of file.");
        };
    };

};