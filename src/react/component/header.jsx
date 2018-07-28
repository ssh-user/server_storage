import React from "react";
import "./header.css";


export class Header extends React.Component {
    render() {
        return (
            <div className="header">
                <p>{this.props.title}</p>
            </div>
        );
    };
};