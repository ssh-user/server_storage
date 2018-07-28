import React from "react";
import "./footer.css";

import { FooterElement } from "./footer_element.jsx";


export class Footer extends React.Component {
    constructor(props) {
        super(props);
    };

    render() {
        return <div className="footer">
            <table ref={this.props.refLink}>
                <tbody>{
                    this.props.list.map((elem, index) => {
                        return <FooterElement data={elem} key={index} />
                    })
                }</tbody>
            </table>
        </div>;
    };
};