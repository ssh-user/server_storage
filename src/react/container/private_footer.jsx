import React from "react";
import { connect } from "react-redux";
import action from "../action/action_private_footer";

import { Footer } from "../component/footer.jsx";


// a little hack to prevent webpack error.
const ipcRenderer = window.require('electron').ipcRenderer;


class PrivateFooter extends React.Component {
    constructor(props) {
        super(props);

        this.addElement = this.addElement.bind(this);
        this.updateElement = this.updateElement.bind(this);
        this.cleanList = this.cleanList.bind(this);

        this.refLink = React.createRef();
    };

    componentDidMount() {
        // subscribe to events.
        ipcRenderer.on("private_add_footer", this.addElement);
        ipcRenderer.on("private_update_footer", this.updateElement);
    };

    componentWillUnmount() {
        // unscribe from events.
        ipcRenderer.removeListener("private_add_footer", this.addElement);
        ipcRenderer.removeListener("private_update_footer", this.updateElement);
    };

    /** Add element to footer. */
    addElement(e, elem) {
        this.props.addElement(elem, this.refLink.current);
    };

    /** Update element in list. */
    updateElement(e, elem) {
        this.props.updateElement(elem);
    };

    /** Clean all elements in list. */
    cleanList() {
        this.props.cleanElements();
    };


    render() {
        return <Footer list={this.props.footer} refLink={this.refLink} />
    };
};


function mapStateToProps(state) {
    return {
        footer: state.privFoot
    };
};

export default connect(mapStateToProps, action)(PrivateFooter);