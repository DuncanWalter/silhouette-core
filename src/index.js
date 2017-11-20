import { Container } from 'vitrarius'
import { __reducers__, __push__, __store__, __root__, __create__, __state__, __children__, __value__, __logger__ } from './symbols'
import { reducer } from './reducer'

import freezePlugin from './plugins/freeze'
import thunkPlugin from './plugins/thunk'
export { freezePlugin }
export { thunkPlugin }

export * from './symbols'

let { get, set, clone, has, cut, members } = Container;

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

function deepMap(){
    this.map = new Map();
}

deepMap.prototype = {
    set(...path/*/, value/*/){
        let value = path.pop();
        path.reduce((a, p) => {
            if(!a.has(p)){
                a.set(p, new Map());
            }
            return a.get(p);
        }, this.map).set(__value__, value);
    },
    get(...path){
        let a = path.reduce((a, p) => {
            a.m = a.m ? a.m.get(p) : undefined;
            a.v = a.m ? a.m.get(__value__) || a.v : a.v;
            return a;
        }, { m: this.map, v: undefined });
        return a.v;
    },
}

function defineSilhouette(){

    let actionQueue = syncQueue();

    let trap = {
        get(trg, mem){
            // console.log(mem);
            if(typeof mem === 'symbol'){
                if(mem.toString() === 'Symbol(util.inspect.custom)'){
                    return () => `Silhouette { ${trg[__state__]} }`;
                } else if(mem === Symbol.toStringTag){
                    return 'Silhouette'
                }
            }
            let c = trg[__children__];
            let h = c && has(trg[__children__], mem);
            let i = mem in trg;
            switch(true){
                case (i && !h): return trg[mem];
                case (c && !h): return trg[__create__](mem);
                case (h): return get(c, mem);
                default: 
                    console.log(mem);
                    throw new Error(`Cannot get child node ${mem} of an empty Silhouette.`);
            }
        },
    };

    class Silhouette{
        constructor(initial){
            let trg = Object.create(Silhouette.prototype);
            trg[__reducers__] = new deepMap(),
            trg[__children__] = undefined,
            trg[__push__]({ value: initial, done: false });
            return new Proxy(trg, trap);
        }
        [__create__](member){
            let c = this[__children__];
            if(!has(c, member)){
                set(c, member, new Silhouette(get(this[__state__], member)));
            }
            return get(c, member);
        }
        bind(type, fun){
            actionQueue.enqueue({ fun, type, [__root__]: this });
            actionQueue.forEach(this[__store__].dispatch);
        }
        dispatch(...typePath/*/, payload/*/){
            let payload = typePath.pop();
            let type = typePath.length <= 1 ? typePath[0] : JSON.stringify(typePath);
            actionQueue.enqueue(Object.assign({ typePath, type }, payload));
            actionQueue.forEach(this[__store__].dispatch);
        }
        extend(...typePath/*/, reducer/*/){
            let reducer = typePath.pop();
            this[__reducers__].set(...typePath, reducer);
        }
        [__push__]({ value, done }){
            if(done){
                this[__children__] = undefined;
                this[__state__] = undefined;
            } else {
                this[__state__] = value;
                if(value === undefined){
                    this[__children__] = undefined;
                } else if(this[__children__] === undefined){
                    this[__children__] = Container.create(value);
                }
            }
        }
        
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
        reducer: reducer.bind(Silhouette), // TODO: freeze extension should go right here
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
