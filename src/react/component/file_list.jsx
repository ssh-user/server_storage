import React from "react";
import { FileElement } from "./file_list_file.jsx";
import { FolderElement } from "./file_list_folder.jsx";
import { FilelistPath } from "./file_list_path.jsx";
import "./file_list.css";


export class Filelist extends React.Component {
    constructor(props) {
        super(props);

        this.setToActive = this.setToActive.bind(this);
        this.clearActiveElement = this.clearActiveElement.bind(this);
        this.goToFolder = this.goToFolder.bind(this);
    };

    componentDidMount() {
        // get file list from server.
        this.props.getList();
    };

    // set element "tr" on active status by click on it.
    setToActive(index) {
        this.props.updateActive(index)
    };

    // go to the parent folder by double clicking on ".." element.
    goToFolder(name) {
        this.props.getList(name);
    };

    // clean active element.
    clearActiveElement(e) {
        if (e.target.nodeName == "TD" || e.target.nodeName == "IMG") {
            // nothing do, element will set to active by deeper code.
        } else {
            // clean active element.
            this.props.updateActive(null);
        };
    };

    render() {
        return (
            <div className="file_list_box" onClick={this.clearActiveElement}>
                <FilelistPath path={this.props.data.path} />

                <table className="table">
                    <thead>
                        <tr className="border_bottom">
                            <th className="row_icon"></th>
                            <th className="row_filename">Filename</th>
                            <th className="row_size">Size</th>
                            <th className="row_date">Last modified</th>
                        </tr>
                    </thead>
                    <tbody>{

                        this.props.data.list.map((elem, index) => {
                            if (elem.isFolder) {
                                return <FolderElement
                                    key={elem.name + index}
                                    index={index}
                                    name={elem.name}
                                    click={this.setToActive}
                                    doubleClick={this.goToFolder}
                                    class={this.props.data.active == index ? "active" : null}
                                />
                            } else {
                                return <FileElement
                                    key={elem.name + index}
                                    index={index}
                                    data={elem}
                                    click={this.setToActive}
                                    class={this.props.data.active == index ? "active" : null}
                                />
                            };
                        })
                    }</tbody>
                </table>

            </div>
        );
    };
};