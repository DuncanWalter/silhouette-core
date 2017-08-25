import { compose, each, inject, remove, optic, chain, view, lens, parallelize, where } from 'vitrarius'
import { __DEFINE__, __REMOVE__, __path__, __reducers__, __push__, __store__, __root__, __create__ } from './symbols'

// contort is a knarly optical function which reduces over 
// a state while continuously updating its silhouette and 
// emitting to relevant streams. This function is the main
// motivation for the creation of the entire optics module.
export function contort({ state, sil, action }){
    
    let transitional = state;

    if(sil[__reducers__][action.type]){
        transitional = sil[__reducers__][action.type](state, action);
    }

    if(transitional === undefined){
        throw new Error('Reducer returned undefined; are you missing a return statement?');
    }

    if(transitional !== state){
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
export function traverse(member){
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



let asObject = o => o instanceof Object ? o : undefined;
let asArray = a => a instanceof Array ? a : undefined;

export function assert(o){
    return __assert__(o);
}

function __assert__({ state, sil, val }){
    let flag = state === undefined;
    if(asArray(val)){
        if(flag || !asArray(state)){
            let res = val.map((v, index) => {
                sil[__create__](sil, index);
                return __assert__({
                    state: (asObject(state) || {})[index],
                    sil: sil[index],
                    val: val[index],
                });
            })
            sil[__push__]({ value: res });
            return val;
        } else {
            return state;
        }
    } else if(asObject(val)){
        let diff = {};
        Object.keys(val).forEach(key => {
            if(!sil.hasOwnProperty(key)){
                flag = true;
                sil[__create__](sil, key);
                diff[key] = __assert__({
                    state: (asObject(state) || {})[key],
                    sil: sil[key],
                    val: val[key],
                });
            } else {
                let temp = __assert__({
                    state: state[key],
                    sil: sil[key],
                    val: val[key],
                });
                if(temp !== state[key]){
                    flag = true;
                    diff[key] = temp;
                }
            }
        });
        if(flag || !asObject(state)){
            var res = Object.assign({}, state, diff);
            sil[__push__]({ value: res });
            return res;
        } else {
            return state;
        }
    } else {
        if(flag){
            sil[__push__]({ value: val });
            return val;
        } else {
            return state;
        }
    }
}

export function erase(member){
    return optic(({state, sil}) => {
        let _state = state;
        if(state.hasOwnProperty(member)){
            _state = Object.assign({}, state);
            delete _state[member];
            sil[member][__push__]({ done: true });
            delete sil[member];
        }
        return _state;
    });
}