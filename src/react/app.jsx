import React from "react";
import { Route, Switch, withRouter } from "react-router-dom";

// toast notification.
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

// Pages.
import Main from "./container/main_view.jsx";
import Config from "./component/config_view.jsx";

// a little hack to prevent webpack error.
const ipcRenderer = window.require('electron').ipcRenderer;


class App extends React.Component {
    constructor(props) {
        super(props);
    };

    componentDidMount() {
        // trigged by menu. Configuration -> config.
        ipcRenderer.on("show_config", () => {
            this.props.history.push("/config");
        });

        // subscribe for some msg from server side.
        ipcRenderer.on("success", (e, msg) => {
            // inform user about some success.
            toast.success(msg);
        });

        ipcRenderer.on("error", (e, msg) => {
            // inform user about some fail.
            toast.error(msg);
        });

        // trigged olny once. on startup application. Check if config file is be.
        let config = ipcRenderer.sendSync("config");

        // if no config open config page.
        if (!config)
            this.props.history.push("/config");
    };

    render() {
        return (
            <div className="app">
                <Switch>
                    <Route exact path="/" component={Main} />
                    <Route path="/config" component={Config} />
                </Switch>
                <ToastContainer autoClose={3000} />
            </div>
        );
    };
};


export default withRouter(App);