import { compose, view, lens, Container } from 'vitrarius'
import { __DEFINE__, __REMOVE__, __path__, __reducers__, __push__, __store__, __root__, __create__, __state__, __children__ } from './symbols'
import { reducer } from './reducer'

import * as __symbols__ from './symbols'
export let symbols = __symbols__;

let { get, set, clone, has, cut, members } = Container;

// TODO get rid of __path__ altogether? is great for debugging, but technically lies after array shifts... might need to keep
// TODO preserve path integrity when using array sils...


// used only to filter out useless dispatches on define calls
function diff(pat, trg){
    if(!(pat instanceof Object || pat instanceof Array)){ return trg !== undefined }
    return members(pat).reduce((a, k) => a && get(trg, k) && diff(get(pat, k), get(trg, k)), trg !== undefined);
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

function defineSilhouette(){

    let actionQueue = syncQueue();

    let trap = {
        get(trg, mem){
            let h = trg[__children__] && has(trg[__children__], mem);
            let i = mem in trg;
            return (i && !h) ? trg[mem] : trg.select(mem);
        },
    };

    function Silhouette(initial, ...path){
        let trg = Object.create(Silhouette.prototype);
        trg[__path__] = path,
        trg[__reducers__] = new Map(),
        trg[__children__] = undefined,
        trg[__push__]({ value: initial, done: false });
        return new Proxy(trg, trap);
    };

    Silhouette.prototype = {
        [__create__](member){
            let c = this[__children__];
            if(!has(c, member)){
                set(c, member, new Silhouette(get(this[__state__], member), ...this[__path__], member));
            }
            return get(c, member);
        },
        define(val, ...path){
            // to keep logs clean and better support redux devtools,
            // dispatches are filtered here.
            if(!view(compose(...path.map(k => o => o[k]), diff.bind(null, val)), this.state)){
                // TODO make it as soft / non intrusive as possible
                actionQueue.enqueue({ 
                    type: '__DEFINE__',
                    [__DEFINE__]: true, 
                    val: val,
                    path: [ ...this[__path__], ...path ],
                });
                actionQueue.forEach(this[__store__].dispatch);
            }
        },
        remove(...path){ // Escape Hatch...
            actionQueue.enqueue({ 
                type: '__REMOVE__',
                [__REMOVE__]: true,
                path: [ ...this[__path__], ...path ],
            });
            actionQueue.forEach(this[__store__].dispatch);
        },
        dispatch(type, payload){
            actionQueue.enqueue(Object.assign({ type }, payload));
            actionQueue.forEach(this[__store__].dispatch);
        },
        extend(type, reducer, compose = false){
            this[__reducers__].set(type, reducer);
        },
        select(...path){
            // TODO make errors friendly for devs
            return path.reduce((a, p) => {
                let c = a[__children__];
                return get(c, p) || a[__create__](p);            
            }, this);
        },
        [__push__]({ value, done }){
            if(done){
                this[__children__] = undefined;
                this[__state__] = undefined;
            } else {
                this[__state__] = value;
                if(this[__children__] === undefined && this[__state__] !== undefined){
                    this[__children__] = Container.create(this.state);
                }
            }
        },
        // TODO: Should this accessor even exist?
        get state(){
            return this[__state__];
        },
        set state(v){
            throw new Error('State cannot be directly set or mutated.');
        },
    };

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
            base[key] = applyPlugin(base[key], plugin[key]);
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
        applyPlugin(namespace, plugin);
    });

    // use the namespace as it stands!
    let store = namespace.createStore(namespace.reducer);
    return namespace.createSil(store);

}
