// reducer_pub_footer.js

const initState = [];


export function publicFooter(state = initState, action) {
    switch (action.type) {

        // add new element to array.
        case "ADD_FOOTER_PUBLIC_LIST": {
            state.push(action.payload);
            return [...state];
        };

        // update element.
        case "UPDATE_FOOTER_PUBLIC_LIST": {
            // search element.
            return state.map((elem) => {
                // update element.
                if (elem.name == action.payload.name)
                    elem = action.payload;

                return elem;
            });
        };

        // clean state.
        case "CLEAN_FOOTER_PUBLIC_LIST": {
            return [];
        };
    };

    return state;
};