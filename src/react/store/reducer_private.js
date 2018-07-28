// reducer_private.js

const initState = {
    path: "/",
    list: [],
    active: null
};


export function privateView(state = initState, action) {
    switch (action.type) {

        case "PRIVATE_LIST": {
            state = Object.assign({}, state, action.payload);
        }; break;

        case "UPDATE_ACTIVE_PRIVATE": {
            state = Object.assign({}, state, action.payload);
        }; break;

    };

    return state;
};