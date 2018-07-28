import React from "react";
import { connect } from "react-redux";
import action from "../action/action_public_footer";

import { Footer } from "../component/footer.jsx";


// a little hack to prevent webpack error.
const ipcRenderer = window.require('electron').ipcRenderer;


class PublicFooter extends React.Component {
    constructor(props) {
        super(props);

        this.addElement = this.addElement.bind(this);
        this.updateElement = this.updateElement.bind(this);
        this.cleanList = this.cleanList.bind(this);

        this.refLink = React.createRef();
    };

    componentDidMount() {
        // subscribe to events.
        ipcRenderer.on("public_add_footer", this.addElement);
        ipcRenderer.on("public_update_footer", this.updateElement);
    };

    componentWillUnmount() {
        // unscribe from events.
        ipcRenderer.removeListener("public_add_footer", this.addElement);
        ipcRenderer.removeListener("public_update_footer", this.updateElement);
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
        footer: state.pubFoot
    };
};

export default connect(mapStateToProps, action)(PublicFooter);