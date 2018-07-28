import React from "react";
import { withRouter } from "react-router-dom";
import "./config_view.css";
import { toast } from "react-toastify";
// a little hack to prevent webpack error.
const ipcRenderer = window.require('electron').ipcRenderer;


class Config extends React.Component {
    constructor(props) {
        super(props);

        this.onSubmit = this.onSubmit.bind(this);
        this.onCancel = this.onCancel.bind(this);
    };

    onSubmit(e) {
        e.preventDefault();
        // preparing config file.
        let config = {
            server: e.target.server.value,
            port: e.target.port.value,
            username: e.target.username.value,
            password: null,
            key: null
        };

        let key = null;
        try {
            key = e.target.key.files[0].path;
        } catch (error) {
            // nothing doing.
        };

        // add key or password depend on which method user chooses.
        if (key)
            config.key = key;
        else
            config.password = e.target.password.value;

        // pass config to main process.
        let err = ipcRenderer.sendSync("save_config", config);
        if (!err)
            // return to home page.
            this.props.history.push("/");
        else
            // DEBUG. сохранить ошибку в файл.
            toast.error("Error on save config.");
    };

    onCancel(e) {
        e.preventDefault();
        // return to home page.
        this.props.history.push("/");
    };

    render() {
        return (
            <div>
                <p>Configuration.</p>
                <form onSubmit={this.onSubmit}>
                    <input type="text" name="server" placeholder="Server domain or ip" required /> <br />
                    <input type="number" name="port" placeholder="port number" required /> <br />
                    <input type="text" name="username" placeholder="username" required /> <br />
                    <input type="password" name="password" placeholder="password" /><br />
                    <input type="file" name="key" /><br />

                    <input type="submit" value="Save" />
                    <input type="button" onClick={this.onCancel} value="Cancel" />
                </form>
            </div>
        );
    };
};

export default withRouter(Config);