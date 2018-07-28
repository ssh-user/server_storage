import React from "react";
import "./file_list_path.css";


export class FilelistPath extends React.Component {
    render() {
        return <div className="fileListPath">
            <input type="text" value={this.props.path} readOnly />
        </div>
    };
};