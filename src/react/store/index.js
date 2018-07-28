import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { appView } from "./reducer_app_view";
import { privateView } from "./reducer_private";
import { publicView } from "./reducer_public";
import { publicFooter } from "./reducer_pub_footer";
import { privateFooter } from "./reducer_priv_footer";


export const store =
    createStore(
        combineReducers({
            app: appView,
            private: privateView,
            public: publicView,
            pubFoot: publicFooter,
            privFoot: privateFooter
        }),
        applyMiddleware(thunk)
    );