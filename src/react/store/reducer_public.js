// reducer_public.js

const initState = {
    path: "/",
    list: [],
    active: null
};


export function publicView(state = initState, action) {
    switch (action.type) {

        case "PUBLIC_LIST": {
            state = Object.assign({}, state, action.payload);
        }; break;

        case "UPDATE_ACTIVE_PUBLIC": {
            state = Object.assign({}, state, action.payload);
        }; break;

    };

    return state;
};