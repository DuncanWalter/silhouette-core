import { compose, view, lens } from 'vitrarius'
import { __DEFINE__, __REMOVE__, __path__, __reducers__, __push__, __store__, __root__, __create__ } from './symbols'
import { reducer } from './reducer'

// used only to filter out useless dispatches on define calls
function diff(pat, trg){
    if(!(pat instanceof Object || pat instanceof Array)){ return trg !== undefined }
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



export function create(...plugins){

    // create a namespace object
    let Silhouette = defineSilhouette();
    let namespace = {
        Silhouette,
        reducer: reducer.bind(Silhouette),
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
            namespace.Silhouette.created = true;
            return sil;
        },
        symbols: { 
            __push__, 
            __create__, 
            __reducers__, 
            __path__, 
            __store__, 
            __root__,
            __DEFINE__, 
            __REMOVE__,
        },
    }

    // use the redux applyMiddleware approach
    // to apply plugins cleanly
    Object.keys(namespace).filter(key => namespace[key] instanceof Function).forEach(key => {
        plugins.map(p => p[key]).filter(f => f).reverse().forEach(f => {
            namespace[key] = f(namespace[key], namespace);
        });
    });

    // use the namespace as it stands!
    let store = namespace.createStore(namespace.reducer);
    return namespace.createSil(store);

}
