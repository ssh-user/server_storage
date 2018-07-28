import React from "react";
import "./file_list_file.css"


export class FileElement extends React.Component {

    _formateDate(date) {
        let d = new Date(date * 1000);
        let year = d.getFullYear();
        let month = (d.getMonth() + 1) > 9 ? d.getMonth() + 1 : "0" + (d.getMonth() + 1);
        let day = d.getDate() > 9 ? d.getDate() : "0" + d.getDate();
        let hour = d.getHours() > 9 ? d.getHours() : "0" + d.getHours();
        let minute = d.getMinutes() > 9 ? d.getMinutes() : "0" + d.getMinutes();

        return `${hour}:${minute} ${day}-${month}-${year}`;
    };

    render() {
        return (
            <tr className={this.props.class} onClick={() => this.props.click(this.props.index)} >
                <td>
                    <img className="image" src="asserts/file.png" alt="folder_img" />
                </td>
                <td className="cellLeft elem_padding_left">{this.props.data.name}</td>
                <td>{(this.props.data.size / 1024 / 1024).toFixed(2)}mb</td>
                <td>{this._formateDate(this.props.data.time)}</td>
            </tr>
        );
    };
};