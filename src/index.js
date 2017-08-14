import { compose, each, inject, remove, optic, chain, view, lens } from 'vitrarius'

// import { createStore } from 'redux'
// TODO if(module.hot){module.hot.accept();} TODO store state to a global for recovery

// non colliding action types
const __DEFINE__ = Symbol('__DEFINE__');
const __REMOVE__ = Symbol('__REMOVE__');

// non-colliding class properties
const __path__ = Symbol('path');
const __reducers__ = Symbol('reducers');
const __push__ = Symbol('push');
const __store__ = Symbol('store');
const __root__ = Symbol('root');
const __create__ = Symbol('create');

// used only to filter out useless dispatches on define calls
function diff(pat, trg){
    if(!(pat instanceof Object || pat instanceof Array)){ return !!trg }
    return Object.keys(pat).reduce((a, k) => a && trg[k] && diff(pat[k], trg[k]), trg !== undefined);
}

function defineSilhouette(){

    class Silhouette {

        [__create__](parent, member){
            let sil = new Silhouette();
            sil[__path__] = parent ? [...parent[__path__], member] : [];
            sil[__reducers__] = {};
            if( parent !== undefined ){ parent[member] = sil; }
            return sil;
        }

        define(val, ...path){
            // to keep logs clean and better support redux devtools,
            // dispatches are filtered here.
            if(!view(compose(...path.map(k => lens(o => o[k], (o, r) => r)), diff.bind(null, val)), this)){
                // TODO make it as soft / non intrusive as possible
                this[__store__].dispatch({ 
                    type: __DEFINE__, 
                    val: val,
                    path: [ ...this[__path__], ...path ],
                });
            }
        }

        remove(...path){ // Escape Hatch...
            this[__store__].dispatch({ 
                type: __REMOVE__,
                path: [ ...this[__path__], ...path ],
            });
        }

        dispatch(type, payload, locally = false){
            this[__store__].dispatch(Object.assign({ 
                type,
                [__path__]: locally ? this[__path__] : [],
            }, payload));
        }

        extend(type, reducer, compose = false){
            if(type instanceof Object){ 
                // TODO snag all properties and continue
            }
            this[__reducers__][type] = reducer;
        }

        [__push__](/*/{ value, done }/*/){/*/OVERWRITE WITH PLUGINS/*/}

    }

    return Silhouette;
}



// contort is a knarly optical function which reduces over 
// a state while continuously updating its silhouette and 
// emitting to relevant streams. This function is the main
// motivation for the creation of the entire optics module.
function contort({ state, sil, action }){

    let transitional = state;

    if(sil[__reducers__][action.type]){
        transitional = sil[__reducers__][action.type](state, action);
    }

    if(transitional === undefined){
        throw new Error('Reducer returned undefined; are you missing a return statement?');
    }

    if(transitional !== state){
        // TODO will Object keys play nice with arrays?
        Object.keys(sil).forEach(key => {
            if(!transitional.hasOwnProperty(key)){
                sil[key][__push__]({ done: true });
                delete sil[key];
            }
        });

        Object.keys(transitional).forEach(key => {
            if(!sil.hasOwnProperty(key)){
                sil[__create__](sil, key);
            }
        });
    }

    let itr = Object.keys(transitional)[Symbol.iterator]();

    let fun = frag => {
        let member = itr.next().value;
        return { 
            state: frag, 
            action: action, 
            sil: sil[member] || sil[__create__](sil, member),
        }
    };

    let final = view(compose(each(), fun, contort), transitional);

    if(final != state){
        sil[__push__]({ done: false, value: final });
    }

    return final;
}

// an optic wrapping the standard pluck optic to
// activate silhouette streams on change detection
function traverse(member){
    return optic(({ state, sil, action }, next) => {
        return view(compose(member, (fragment) => {
            if(!sil[member]){ sil[__create__](sil, member); }
            let ret = next({ state: fragment || {}, sil: sil[member], action });
            if(ret !== state){
                sil[member][__push__]({ done: false, value: ret });
            }
            return ret;
        }), state)
    });
}

function repsert(val){
    return optic(({state, sil}) => {
        Object.keys(val).forEach(key => {
            if(!sil || !sil.hasOwnProperty(key)){
                sil[__create__](sil, key);
                view(repsert(val[key]), { state: undefined, sil: sil[key] });
            }
        });
        if(val !== state){
            sil[__push__]({ done: false, value: val });
        }
        return val;
    });
}

// TODO replace repsert...
// function define(val){
//     return optic(({state, sil}) => {
//         if(state === val){ return state; }
//         let _state = state;
//         if(typeof state !== typeof val){ _state = val; }
//         Object,keys(val).


//         Object.keys(val).forEach(key => {
//             if(!sil || !sil.hasOwnProperty(key)){
//                 sil[__create__](sil, key);
//                 view(define(val[key]), { state: state[key], sil: sil[key] });
//             }
//         });
//         if(val !== state){
//             sil[__push__]({ done: false, value: val });
//         }
//         return val;
//     });
// }

function erase(member){
    return optic(({state, sil}) => {
        let _state = state;
        if(state.hasOwnProperty(member)){
            _state = Object.keys(state).reduce((a, k) => {
                a[k] = state[k];
                return a;
            }, {});
            delete _state[member];
            sil[member][__push__]({ done: true });
            delete sil[member];
        }
        return _state;
    });
}

function globalReducer(S, state = {}, action){
    let path, payload, val, sil = S.prototype[__root__];
    switch(action.type){
        case __DEFINE__:
            ({ val, path } = action);
            let _define = compose(...path.map(traverse), repsert(val));
            return view(_define, { state, sil });

        case __REMOVE__:
            ({ path } = action);
            let eraser = erase(path.pop());
            let remove = compose(...path.map(traverse), eraser);
            return view(remove, { state, sil });

        default:
            path = action[__path__];
            let dispatch = compose(...path.map(traverse), contort);
            return view(dispatch, { state, sil, action });
    }
}

export function create(...plugins){

    // create a namespace object
    let namespace = {
        Silhouette: defineSilhouette(),
        createStore(reducer){
            let state = {};
            return {
                dispatch(action){ state = reducer(state, action); }
            };
        },
        createSil(store){
            let sil = namespace.Silhouette.prototype[__create__]();
            namespace.Silhouette.prototype[__store__] = store;
            namespace.Silhouette.prototype[__root__] = sil;
            return sil;
        },
        symbols: { __push__, __create__, __reducers__ },
    }

    // use the redux applyMiddleware approach
    // to apply plugins cleanly
    Object.keys(namespace).filter(key => namespace[key] instanceof Function).forEach(key => {
        plugins.map(p => p[key]).filter(f => f).reverse().forEach(f => {
            namespace[key] = f(namespace[key], namespace);
        });
    });

    // use the namespace as it stands!
    let reducer = globalReducer.bind(undefined, namespace.Silhouette);
    let store = namespace.createStore(reducer);
    return namespace.createSil(store);

}
