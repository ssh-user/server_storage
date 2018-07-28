import React from "react";
import { connect } from 'react-redux'
import action from "../action/action_private";
import "./private.css";
// a little hack to prevent webpack error.
const ipcRenderer = window.require('electron').ipcRenderer;

import { Header } from "../component/header.jsx";
import { Button } from "../component/button.jsx";
import { Filelist } from "../component/file_list.jsx";
import PrivateFooter from "./private_footer.jsx";


class Private extends React.Component {
    constructor(props) {
        super(props);

        this.download = this.download.bind(this);
        this.upload = this.upload.bind(this);
        this.remove = this.remove.bind(this);

        this.refresh = this.refresh.bind(this);
    };

    componentDidMount() {
        // subscribe to events.
        ipcRenderer.on("refresh_private", this.refresh);
    };

    componentWillUnmount() {
        // unscribe from events.
        ipcRenderer.removeListener("refresh_private", this.refresh);
    };

    /** Download file\folder from server */
    download() {
        // call action to download file\folder.
        this.props.download();
    };

    /** Upload file\folder to server */
    upload() {
        // call action to upload file\folder.
        this.props.upload();

    };

    /** Remove file\folder from server. */
    remove() {
        // call action to remove file\folder.
        this.props.remove();
    };

    /** Refresh view when file uploaded or removed. */
    refresh() {
        // call action method to get file list.
        this.props.getPrivateList();
    };

    render() {
        if (this.props.show) {

            return <div className="private-container">
                <Header title="Private" />
                <div className="group_controls">
                    <Button class="small button green" title="Download" callback={this.download} />
                    <Button class="small button blue" title="Upload" callback={this.upload} />
                    <Button class="small button red" title="Remove" callback={this.remove} />
                </div>
                <Filelist
                    data={this.props.data}
                    getList={this.props.getPrivateList}
                    updateActive={this.props.updateActive}
                />
                <PrivateFooter />
            </div>;

        } else {
            return null;
        };
    };
};


function mapStateToProps(state) {
    return {
        data: state.private
    };
};

export default connect(mapStateToProps, action)(Private);