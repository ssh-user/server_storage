const { Client } = require("ssh2");
const { sep, join } = require("path");
const { createWriteStream, createReadStream, stat } = require("fs");

// 3 minutes.
const TIMER_TO_CLOSE = 1000 * 60 * 3;


module.exports.SFTP = class SFTP extends Client {
    constructor(configFile) {
        super();
        // config file.
        this.configFile = configFile;

        // cache of sftp module.
        this.sftpCache = null;

        // timer for CleanSettimout to close connection.
        this.killer = null;

        // Prevent multi connection. When two requests arrive and the server isn't connected.
        this.isConnection = false;
    };

    /** Connect to remote server by config file. */
    _openConnection() {
        return new Promise((resolve, reject) => {
            // prevent empty config file.
            if (!this.configFile) reject("no config");

            // enable isConnection flag to prevent another request connect to server.
            this.isConnection = true;

            this.once("ready", resolve);
            this.once("error", reject);

            // connect to server.
            this.connect({
                host: this.configFile.server,
                port: this.configFile.port,
                username: this.configFile.username,
                // if user set key - ignore password field.
                password: this.configFile.key ? undefined : this.configFile.password,
                privateKey: this.configFile.key ? this.configFile.key : undefined
            });
        });
    };

    /** Close connection. */
    _closeConnection() {
        // prevent memory leak by AddEventListners.
        this.removeAllListeners("ready");
        this.removeAllListeners("error");

        // close sftp.
        this.sftpCache.end();

        this.sftpCache = null;
        this.killer = null;

        // close connection.
        this.end();
    };

    /** Connect to server and return SFTP module.
     *  Close connection after 3 minutes without activity.
     * @returns {SFTPWrapper} sftp.
     */
    _getSftp() {
        return new Promise(async (resolve, reject) => {
            // Check if connection established yet.
            if (this.sftpCache) {

                // restart killer.
                clearTimeout(this.killer);
                this.killer = setTimeout(this._closeConnection.bind(this), TIMER_TO_CLOSE);

                return resolve(this.sftpCache);
            };

            // check if connection to server in progress.
            if (this.isConnection) {
                // wait before connection established.
                while (this.isConnection) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                };

                // restart killer.
                clearTimeout(this.killer);
                this.killer = setTimeout(this._closeConnection.bind(this), TIMER_TO_CLOSE);

                return resolve(this.sftpCache);
            };

            try {
                // if no connection in progress and no cache we open connection to server.
                await this._openConnection();

                // connect sftp to remote server.
                this.sftp((err, sftp) => {

                    if (err) reject(err);
                    else {
                        // cache sftp to future connections.
                        this.sftpCache = sftp;
                        // disable flag.
                        this.isConnection = false;
                        // enable "killer".
                        this.killer = setTimeout(this._closeConnection.bind(this), TIMER_TO_CLOSE);

                        return resolve(this.sftpCache);
                    };
                });
            } catch (error) {
                // pass error to parent.
                reject(error);
            };
        });
    };

    /**
     * Get file size (and other stats if need) from remote server.
     * @param { String } path path to remote file.
     */
    _getFileSizeRemote(path) {
        return new Promise(async (resolve, reject) => {
            // connect to server.
            let sftp = await this._getSftp();

            // get file stats.
            sftp.stat(path, (err, stats) => {
                if (err) reject(err);
                else resolve(stats.size);
            });

        });
    };

    /**
     * Get file size (and other stats if need) from local comp.
     * @param { String } path path to local file.
     */
    _getFileSizeLocal(path) {
        return new Promise((resolve, reject) => {
            stat(path, (err, stats) => {
                if (err) reject();
                else resolve(stats.size);
            });
        });
    };

    /**
     * Create folder on remote server (recursive).
     * @param { String } store where create foldres.
     * @param { String } folders path with folders names.
     */
    createFolder(store, folders) {
        return new Promise(async (resolve, reject) => {
            // get array of folders name.
            let arrFolders = folders.split(sep);

            // path which will be grow.
            let path = store;

            for (const folder of arrFolders) {
                // update path.
                path = join(path, folder);

                let sftp = await this._getSftp();

                // create folder.
                await new Promise(async (resolve, reject) => {
                    sftp.mkdir(join(path), (err) => {
                        // if (err) reject(err);
                        // if this folder exists on server it throw error so just ignor err.
                        // DEBUG. переписать на проверку на существование.
                        resolve();
                    });
                });
            };

            resolve();
        });
    };

    /** 
     * Get file names and stats from servet by path. 
     * @param { String } path path to folder.
     * @returns { Promise<Array> }
    */
    async getFileList(path) {
        try {
            // error of empty variable.
            if (!path)
                throw new Error("Should be pass path to function 'getFileList'");

            // connect to server
            let sftp = await this._getSftp();

            return await new Promise((resolve, reject) => {
                sftp.readdir(path, (err, list) => {
                    if (err)
                        reject(err);
                    else
                        resolve(list);
                });
            });
        } catch (error) {
            throw error;
        };
    };

    /**
     * Get all file names recursive from remote server.
     * @param { String } sourceFolder path to source folder.
     * @returns {Promise<String[]>} pathes to file.
    */
    async getFileNamesRecursive(sourceFolder) {
        // get file list from remote server.
        const subdirs = await this.getFileList(sourceFolder);
        // iterate it and if it will be folder, not a file, start again.
        const files = await Promise.all(subdirs.map(async (subdir) => {
            let result = join(sourceFolder, subdir.filename);
            if (subdir.attrs.isDirectory()) {
                result = await this.getFileNamesRecursive(result);
            };
            return result;
        }));
        // concat all result to one array and return to user.
        return files.reduce((target, sub) => target.concat(sub), []);
    };

    /**
     * Bad code. Mayby should rewrite it.
     * WARNING. SOURCE FOLDER ISN'T INCLUDE.
     * Get all sub-folder names recursive from remote server.
     * @param { String } source path to source folder.
     * @returns {Promise<String[]>} pathes to folders.
    */
    async getFolderNamesRecursive(source) {
        // get file list from remote server and filter files.
        const subdirs = (await this.getFileList(source)).filter((elem) => {
            if (elem.attrs.isDirectory())
                return true;
            return false;
        });

        // iterate all of them and get sub-folders again.
        const folders = await Promise.all(subdirs.map(async (subdir) => {
            let result = [join(source, subdir.filename)];
            let tempArr = await this.getFolderNamesRecursive(result[0]);
            return result.concat(tempArr);
        }));

        // concat all result to one array and return to user.
        return folders.reduce((target, sub) => target.concat(sub), []);
    };

    /**
     * Download file from remote server by path.
     * @param { String } source path to sourse file on remote server.
     * @param { String } target path to target file on user pc.
     * @param { Function } percentage Callback to send percent. Trigger every chunk.
     */
    async downloadFile(source, target, percentage) {
        let wstream = null;
        let rstream = null;

        try {
            // get sftp connection.
            let sftp = await this._getSftp();

            // create writestream on user pc.
            wstream = createWriteStream(target);

            // create read stream from remote server.
            rstream = sftp.createReadStream(source);

            // this needs only for percent of downloaded. Stupid I agree.
            if (percentage) {
                // get source file size.
                let sourceSize = await this._getFileSizeRemote(source);
                let downloaded = 0;

                rstream.on("data", (chunk) => {
                    // get size of every chunk.
                    downloaded += chunk.length;
                    // pass to callback percent of downloaded file.
                    percentage((downloaded / sourceSize * 100).toFixed(2));
                });
            };

            return await new Promise((resolve, reject) => {
                // error handler.
                rstream.once("error", reject);
                wstream.once("error", reject);
                wstream.once("finish", resolve);

                // write income data form source to user file.
                rstream.pipe(wstream);
            });

        } catch (err) {
            // close streams.
            if (rstream) rstream.destroy();
            if (wstream) wstream.end();

            // pass error to parent.
            throw err;
        };
    };

    /**
     * Upload file to remote server.
     * @param { String } source path to sourse file on user pc
     * @param { String } target path to target file on remote server.
     * @param { Function } percentage Callback to send percent. Trigger every chunk.
     */
    async uploadFile(source, target, percentage) {
        let wstream = null;
        let rstream = null;

        try {
            // get sftp connection.
            let sftp = await this._getSftp();

            // create writestream on user pc.
            wstream = sftp.createWriteStream(target);

            // create read stream from remote server.
            rstream = createReadStream(source);

            // this needs only for percent of downloaded. Stupid I agree.
            if (percentage) {
                // get source file size.
                let sourceSize = await this._getFileSizeLocal(source);
                let downloaded = 0;

                rstream.on("data", (chunk) => {
                    // get size of every chunk.
                    downloaded += chunk.length;
                    // pass to callback percent of downloaded file.
                    percentage((downloaded / sourceSize * 100).toFixed(2));
                });
            };

            return await new Promise((resolve, reject) => {
                // error handler.
                rstream.once("error", reject);
                wstream.once("error", reject);
                wstream.once("finish", resolve);

                // write income data form source to user file.
                rstream.pipe(wstream);
            });

        } catch (err) {
            // close streams.
            if (rstream) rstream.destroy();
            if (wstream) wstream.end();

            // pass error to parent.
            throw err;
        };
    };

    /**
     * Remove file from remote server.
     * @param { String } target path to file.
     */
    async removeFile(target) {
        return new Promise(async (resolve, reject) => {
            try {
                let sftp = await this._getSftp();

                sftp.unlink(target, (err) => {
                    if (err) throw err;
                    else resolve();
                });

            } catch (error) {
                reject(error);
            };
        });
    };

    /**
     * Remove folder from remote server.
     * @param { String } target path to folder.
     */
    async removeDir(target) {
        return new Promise(async (resolve, reject) => {
            try {
                let sftp = await this._getSftp();

                sftp.rmdir(target, (err) => {
                    if (err) throw err;
                    else resolve();
                });

            } catch (error) {
                reject(error);
            };
        });
    };

};
