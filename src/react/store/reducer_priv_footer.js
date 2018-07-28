// reducer_priv_footer.js

const initState = [];


export function privateFooter(state = initState, action) {
    switch (action.type) {

        // add new element to array.
        case "ADD_FOOTER_PRIVATE_LIST": {
            state.push(action.payload);
            return [...state];
        };

        // update element.
        case "UPDATE_FOOTER_PRIVATE_LIST": {
            // search element.
            return state.map((elem) => {
                // update element.
                if (elem.name == action.payload.name)
                    elem = action.payload;

                return elem;
            });
        };

        // clean state.
        case "CLEAN_FOOTER_PRIVATE_LIST": {
            return [];
        };
    };

    return state;
};