import { compose, each, inject, remove, optic, chain, view, lens } from 'vitrarius'
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

export function repsert(val){
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

export function erase(member){
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