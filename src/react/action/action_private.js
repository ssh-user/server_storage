// action_private.js

// notification.
import { toast } from "react-toastify";

const { join } = require("path");

// a little hack to prevent webpack error.
const ipcRenderer = window.require('electron').ipcRenderer;


// get file list from path.
function getPrivateList(path = "/") {
    return (dispatch, getState) => {
        // get global variable "path"
        let state = getState();
        let globalPath = state.private.path;

        path = join(globalPath, path);

        // subscribe to answer.
        ipcRenderer.once("private_list", (e, list) => {
            // sort array folders should be on top.
            list.sort((a, b) => {
                if (a.isFolder) return 0;
                else return 1;
            });

            // add to list new element. it's "go to parent folder";
            list.unshift({
                name: "..",
                isFolder: true
            });

            dispatch({
                type: "PRIVATE_LIST",
                payload: {
                    path: path,
                    list: list,
                    active: null
                }
            });
        });

        // send a request of private list.
        ipcRenderer.send('private_list', path);
    };
};

/** Update active element. */
function updateActive(index) {
    return (dispatch) => {
        dispatch({
            type: "UPDATE_ACTIVE_PRIVATE",
            payload: {
                active: index
            }
        });
    };
};

/** Download file\folder from server to user. */
function download() {
    return (dispatch, getState) => {
        let data = getState().private;

        // if no selected file\folder then nothing doing OR
        // if active element is ".." (go to parent folder).
        if (data.active == null || data.active == 0)
            return toast.warn("Please select a file or folder to download.");

        // obj to send.
        let request = {};
        // set public or private store.
        request.store = "private";
        // set full path with file\folder name.
        request.path = join(data.path, data.list[data.active].name);
        // set file name.
        request.name = data.list[data.active].name;
        // set property is it folder or not.
        request.isFolder = data.list[data.active].isFolder;

        // send to server.
        ipcRenderer.send("download", request);
    };
};

/** Upload to server file\folder. */
function upload() {
    return (dispatch, getState) => {
        // get store data.
        let data = getState().private;
        // obj to send.
        let request = {};
        // set public or private store.
        request.store = "private";
        // set path.
        request.path = data.path;
        // send to server.
        ipcRenderer.send("upload", request);
    };
};

/** Remove file\folder. */
function remove() {
    return (dispatch, getState) => {
        let data = getState().private;

        // if no selected file\folder then nothing doing OR
        // if active element is ".." (go to parent folder).
        if (data.active == null || data.active == 0)
            return toast.warn("Please select a file or folder to remove.");

        // obj to send.
        let request = {};
        // set public or private store.
        request.store = "private";
        // set full path with file\folder name.
        request.path = join(data.path, data.list[data.active].name);
        // set file name.
        request.name = data.list[data.active].name;
        // set property is it folder or not.
        request.isFolder = data.list[data.active].isFolder;

        // DEBUG. проверить как ведет себя блокирующий код при закачке\скачке.
        if (confirm(`Are you sure to remove this ${request.isFolder ? "folder" : "file"} ?`)) {
            // send to server.
            ipcRenderer.send("remove", request);
        };
    };
};


export default {
    getPrivateList,
    updateActive,
    download,
    upload,
    remove
};