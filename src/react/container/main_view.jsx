import React from "react";
import { connect } from 'react-redux'
import action from "../action/action_main_view";

// a little hack to prevent webpack error.
const ipcRenderer = window.require('electron').ipcRenderer;
import "./main_view.css";

import Public from "./public.jsx";
import Private from "./private.jsx";


class MainView extends React.Component {
    constructor(props) {
        super(props);

        // control css rules to show 1 or 2 columns when user toggle private\public panels.
        this.state = { class: "main_container_full" };

        this.togglePublic = this.togglePublic.bind(this);
        this.togglePrivate = this.togglePrivate.bind(this);
    };

    componentDidMount() {
        // subscribe to toggle events.
        ipcRenderer.on("toggle_public", this.togglePublic);
        ipcRenderer.on("toggle_private", this.togglePrivate);
    };

    componentWillUnmount() {
        // unscribe from events.
        ipcRenderer.removeListener("toggle_public", this.togglePublic);
        ipcRenderer.removeListener("toggle_private", this.togglePrivate);
    };

    togglePublic() {
        this.props.togglePublic();

        // change css grid class to 1 or 2 colums.
        if (this.props.view.public && this.props.view.private)
            this.setState({ class: "main_container_full" });
        else
            this.setState({ class: "main_container_short" });
    };

    togglePrivate() {
        this.props.togglePrivate();

        // change css grid class to 1 or 2 colums.
        if (this.props.view.public && this.props.view.private)
            this.setState({ class: "main_container_full" });
        else
            this.setState({ class: "main_container_short" });
    };


    render() {
        return <div className={this.state.class}>
            <Public show={this.props.view.public} />
            <Private show={this.props.view.private} />
        </div>;
    };
};


function mapStateToProps(state) {
    return {
        view: state.app
    };
};

export default connect(mapStateToProps, action)(MainView);