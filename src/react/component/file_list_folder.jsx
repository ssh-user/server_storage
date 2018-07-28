import React from "react";


export class FolderElement extends React.Component {

    render() {
        return (
            <tr
                className={this.props.class}
                onClick={() => this.props.click(this.props.index)}
                onDoubleClick={() => this.props.doubleClick(this.props.name)}
            >
                <td>
                    <img className="image" src="asserts/folder.png" alt="folder_img" />
                </td>
                <td className="cellLeft elem_padding_left">
                    {this.props.name}
                </td>

                <td colSpan="2"></td>

            </tr>
        );
    };
};