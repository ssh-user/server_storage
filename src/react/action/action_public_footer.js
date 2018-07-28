// action_public_footer.js

// add element to footer public list.
function addElement(elem, ref) {
    return (dispatch) => {
        dispatch({
            type: "ADD_FOOTER_PUBLIC_LIST",
            payload: elem
        });

        // scroll to last element.
        ref.parentNode.scrollTop = ref.scrollHeight;
    };
};

// update element from footer public list.
function updateElement(elem) {
    return (dispatch) => {
        dispatch({
            type: "UPDATE_FOOTER_PUBLIC_LIST",
            payload: elem
        });
    };
};

// remove all elements from footer public list.
function cleanElements() {
    return (dispatch, getState) => {
        dispatch({
            type: "CLEAN_FOOTER_PUBLIC_LIST",
            payload: null
        });
    };
};


export default {
    addElement,
    updateElement,
    cleanElements
};