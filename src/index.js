import { compose, view, lens } from 'vitrarius'
import { __DEFINE__, __REMOVE__, __path__, __reducers__, __push__, __store__, __root__, __create__, __state__, __children__ } from './symbols'
import { reducer } from './reducer'

import * as __symbols__ from './symbols'
export let symbols = __symbols__;

// used only to filter out useless dispatches on define calls
function diff(pat, trg){
    if(!(pat instanceof Object || pat instanceof Array)){ return trg !== undefined }
    return Object.keys(pat).reduce((a, k) => a && trg[k] && diff(pat[k], trg[k]), trg !== undefined);
}

function syncQueue(){
    let active = false;
    let next = { };
    let last = next;
    return {
        enqueue(action){
            last.value = action;
            last.next = { };
            last = last.next;
        },
        forEach(fun){
            if(active){ return };
            active = true;
            while(next.next){
                fun(next.value);
                next = next.next;
            }
            active = false;
        },
    }
}

// TODO flesh out further?
function asMap(data){
    return data instanceof Map ? data : Object.assign(Object.create(data), {
        get(i){ return data[i]; },
        set(i, v){ data[i] = v; },
    });
}

function defineSilhouette(){

    let actionQueue = syncQueue();

    class Silhouette {

        constructor(initial, ...path){
            Object.assign(this, {
                [__path__]: path,
                [__reducers__]: new Map(),
                [__children__]: undefined,
            });
            this[__push__]({ value: initial, done: false });
        }

        [__create__](member){
            let c = this[__children__];
            if(!c.get(member)){
                c.set(member, new Silhouette(this[__state__][member], ...this[__path__], member));
            }
            return c.get(member);
        }

        define(val, ...path){
            // to keep logs clean and better support redux devtools,
            // dispatches are filtered here.
            if(!view(compose(...path.map(k => lens(o => o[k], (o, r) => r)), diff.bind(null, val)), this)){
                // TODO make it as soft / non intrusive as possible
                actionQueue.enqueue({ 
                    type: '__DEFINE__',
                    [__DEFINE__]: true, 
                    val: val,
                    path: [ ...this[__path__], ...path ],
                });
                actionQueue.forEach(this[__store__].dispatch);
            }
        }

        remove(...path){ // Escape Hatch...
            actionQueue.enqueue({ 
                type: '__REMOVE__',
                [__REMOVE__]: true,
                path: [ ...this[__path__], ...path ],
            });
            actionQueue.forEach(this[__store__].dispatch);
        }

        dispatch(type, payload){
            actionQueue.enqueue(Object.assign({ type }, payload));
            actionQueue.forEach(this[__store__].dispatch);
        }

        extend(type, reducer, compose = false){
            this[__reducers__].set(type, reducer);
        }

        select(...path){
            // TODO make errors friendly for devs
            return path.reduce((a, p) => {
                return a[__children__].get(p) || a[__create__](p);            
            }, this);
        }

        [__push__]({ value, done }){
            if(done){
                this[__children__] = undefined;
                this[__state__   ] = undefined;
            } else {
                this[__state__] = value;
                if(this[__children__] === undefined){
                    if(value instanceof Array){
                        this[__children__] = asMap([]);
                    } else {
                        this[__children__] = new Map();
                    }
                }
            }
        }

        get state(){
            return this[__state__];
        }

        set state(v){
            throw new Error('State cannot be directly set or mutated.');
        }

    }

    return Silhouette;
}

// use the redux applyMiddleware approach
// on recursive steroids
// to apply plugins cleanly
function applyPlugin(base, plugin){
    Reflect.ownKeys(plugin).forEach(key => {
        if(plugin[key] instanceof Function){
            base[key] = plugin[key](base[key]);
        } else if(plugin[key] instanceof Object){
            base[key] = applyPlugin(base[key] || {}, plugin[key]);
        } else {
            throw new Error('The plugin provided contained terminal properties which were not middleware functions.');
        }
    });
    return base;
};


export function create(...plugins){

    // create a namespace object
    let Silhouette = defineSilhouette();
    let namespace = {
        Silhouette,
        prototype: Silhouette.prototype,
        reducer: reducer.bind(Silhouette),
        createStore(reducer){
            let state = {};
            return {
                dispatch(action){
                    state = reducer(state, action); 
                }
            };
        },
        createSil(store){
            let sil = new namespace.Silhouette({});
            namespace.Silhouette.prototype[__store__] = store;
            namespace.Silhouette.prototype[__root__] = sil;
            namespace.Silhouette.created = true;
            return sil;
        },
    };

    plugins.reverse().forEach(plugin => {
        applyPlugin(namespace, plugin, namespace);
    });

    // use the namespace as it stands!
    let store = namespace.createStore(namespace.reducer);
    return namespace.createSil(store);

}
