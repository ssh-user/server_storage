// action_public.js

// notification.
import { toast } from "react-toastify";

const { join } = require("path");

// a little hack to prevent webpack error.
const ipcRenderer = window.require('electron').ipcRenderer;


// get file list from path.
function getPublicList(path = "/") {
    return (dispatch, getState) => {
        // get global variable "path"
        let state = getState();
        let globalPath = state.public.path;

        path = join(globalPath, path);

        // subscribe to answer.
        ipcRenderer.once("public_list", (e, list) => {
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
                type: "PUBLIC_LIST",
                payload: {
                    path: path,
                    list: list,
                    active: null
                }
            });

        });

        // send a request of public list.
        ipcRenderer.send('public_list', path);
    };
};

/** Update active element. */
function updateActive(index) {
    return (dispatch) => {
        dispatch({
            type: "UPDATE_ACTIVE_PUBLIC",
            payload: {
                active: index
            }
        });
    };
};

/** Download file\folder from server to user. */
function download() {
    return (dispatch, getState) => {
        let data = getState().public;

        // if no selected file\folder then nothing doing OR
        // if active element is ".." (go to parent folder).
        if (data.active == null || data.active == 0)
            return toast.warn("Please select a file or folder to download.");

        // obj to send.
        let request = {};
        // set public or private store.
        request.store = "public";
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
        let data = getState().public;
        // obj to send.
        let request = {};
        // set public or private store.
        request.store = "public";
        // set path.
        request.path = data.path;
        // send to server.
        ipcRenderer.send("upload", request);
    };
};

/** Remove file\folder. */
function remove() {
    return (dispatch, getState) => {
        let data = getState().public;

        // if no selected file\folder then nothing doing OR
        // if active element is ".." (go to parent folder).
        if (data.active == null || data.active == 0)
            return toast.warn("Please select a file or folder to remove.");

        // obj to send.
        let request = {};
        // set public or private store.
        request.store = "public";
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

/** Get link to file. */
function getLink() {
    return (dispatch, getState) => {
        let data = getState().public;

        // if no selected file then nothing doing OR
        // if active element is ".." (go to parent folder).
        if (data.active == null || data.active == 0 || data.list[data.active].isFolder)
            return toast.warn("Please select ONLY file to get link on it.");

        // send to server.
        ipcRenderer.send("link", join("public", data.path, data.list[data.active].name));
    };
};


export default {
    getPublicList,
    updateActive,
    getLink,
    download,
    upload,
    remove
};