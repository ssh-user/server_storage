import React from "react";
import "./button.css";


export class Button extends React.Component {
    render() {
        return (
            <div>
                <button
                    onClick={this.props.callback}
                    className={this.props.class}
                >
                    {this.props.title}
                </button>
            </div>
        );
    };
};