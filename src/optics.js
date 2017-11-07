import { compose, optic, chain, view, lens } from 'vitrarius'
import { __DEFINE__, __REMOVE__, __path__, __reducers__, __push__, __store__, __root__, __create__, __state__, __children__ } from './symbols'

const blank = Object.create(null);

function clone(data){
    switch(true){
        case data instanceof Array: return data.map(i => i);
        case data instanceof Object: return Object.assign({}, data);
        default: return data;
    }
}

export let contort = ({ state, sil, action }) => __contort__(state, sil, action);
function __contort__(state, sil, action){

    let r = sil[__reducers__].get(action.type);
    let t = r ? r(state, action) : state;
    
    if(t === undefined){
        throw new Error('Reducer returned undefined; are you missing a return statement?');
    }

    let c = sil[__children__] || blank;

    t = Object.keys(t).reduce((a, k) => {

        let temp = a;
        let child = c.get(k);
        let fragment = child ? __contort__(temp[k], child, action) : temp[k];
        
        if(fragment != temp[k]){
            if(temp === t){
                temp = t instanceof Array ? t.map(i => i) : Object.assign({}, t);
            }
            temp[k] = fragment;
        }

        return temp;
    }, t);

    Object.keys(sil[__state__]).forEach(k => {
        if(!t.hasOwnProperty(k)){
            if(t instanceof Array){
                while (t.length < sil[__children__].length) sil[__children__].pop(); 
            } else if(t instanceof Object){
                sil[__children__].delete(k);
            }
        }
    });

    if(t != sil[__state__]){
        sil[__push__]({ done: false, value: t });
    }

    return t;
}

// an optic wrapping the standard pluck optic to
// activate silhouette streams on change detection
export function traverse(member){
    return optic(({ sil, action }, next) => {
        let state = sil.state;
        let fragment = next({ 
            sil: sil.select(member),
            state: state[member],
            action,
        });
        if(state[member] !== fragment){
            state = clone(state);
            state[member] = fragment;
            sil[__push__]({ value: state, done: false });
        }
        return state;
    });
}


export let assert = ({ state, sil, val }) => __assert__(state, sil, val);
function __assert__(state, sil, val){

    if(state === val){
        return val;
    } else if(state === undefined || state != sil.state){
        sil[__push__]({ value: val, done: false });
        return val;
    } else {
        let ret = Object.keys(val).reduce((a, k) => {
            let t = a;
            if(!t.hasOwnProperty(k)){
                if(t === sil[__state__]){
                    t = t instanceof Array ? t.map(i => i) : Object.assign({}, t);
                }
                let c = sil.select(k);
                t[k] = __assert__(undefined, c, val[k]);
            }
            return t;
        }, state);

        if(ret !== state){
            sil[__push__]({ done: false, value: ret });
        }

        return ret;
    }    
}


export let erase = member => ({ state, sil }) => __erase__(state, sil, member);
function __erase__(state, sil, member){
    if(state.hasOwnProperty(member)){
        let t =  state instanceof Array ? state.map(i => i) : Object.assign({}, state);
        if(state instanceof Array){
            t[member] = undefined;
        } else {
            delete t[member];
        }
        sil[__push__]({ value: t, done: false });
        let c = sil[__children__] instanceof Array ? sil[__children__][member] : sil[__children__].get(member);
        if(c){
            c[__push__]({ done: true });
        }
        return t;
    } else {
        return state;
    }
}