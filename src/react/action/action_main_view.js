// action_main_view.js

// toggle private field
function togglePrivate() {

    return {
        type: 'TOGGLE_PRIVATE',
        payload: null
    };

};

// toggle public field
function togglePublic() {

    return {
        type: 'TOGGLE_PUBLIC',
        payload: null
    };

};

export default {
    togglePublic,
    togglePrivate
};