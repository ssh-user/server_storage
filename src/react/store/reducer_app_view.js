// reducer_app_view.js

const initState = {
    public: true,
    private: true
};


export function appView(state = initState, action) {
    switch (action.type) {

        case "TOGGLE_PUBLIC": {

            let newState = Object.assign({}, state);
            newState.public = !state.public;
            return newState;

        };

        case "TOGGLE_PRIVATE": {

            let newState = Object.assign({}, state);
            newState.private = !state.private;
            return newState;

        };
    };

    return state;
};