import React from "react";
import "./footer_element.css";


export class FooterElement extends React.Component {
    constructor(props) {
        super(props);
    };

    render() {
        // choose type of action download\upload.
        let type = null;
        if (this.props.data.type == "download")
            type = <img src="asserts/download.png" alt="download" />;
        else if (this.props.data.type == "upload")
            type = <img src="asserts/upload.png" alt="upload" />;


        return <tr>
            <td className="cell_icon">{type}</td>
            <td className="cell_title"><span>{this.props.data.name}</span></td>
            <td className="cell_progress_bar">
                <div className="progress_bar">
                    <div className="progress" style={{ width: `${this.props.data.percent}%` }}>
                        <span>{this.props.data.percent}%</span>
                    </div>
                </div>
            </td>
        </tr>;
    };
};