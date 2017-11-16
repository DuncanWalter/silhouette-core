import { Container } from 'vitrarius'
import { __DEFINE__, __REMOVE__, __path__, __reducers__, __push__, __store__, __root__, __create__, __state__, __children__ } from './symbols'

let { get, set, cut, clone, has, members } = Container;

export let contort = ({ state, sil, action }) => __contort__(state, sil, action);
function __contort__(state, sil, action){


    let r = sil[__reducers__].get(action.type);
    let t = r ? r(state, action) : state;
    
    if(t === undefined){
        throw new Error('Reducer returned undefined; are you missing a return statement?');
    }

    let c = sil[__children__];

    t = members(t).reduce((a, k) => {

        let temp = a;
        let child = c ? get(c, k) : undefined;
        let fragment = child ? __contort__(get(temp, k), child, action) : get(temp, k);
        
        if(fragment !== get(temp, k)){
            if(temp === t){ temp = clone(t); }
            set(temp, k, fragment);
        }

        return temp;
    }, t);

    // TODO: needs lots of work to be container compliant and
    // TODO: preserve accurate __path__ trails
    members(sil[__state__]).forEach(m => {
        if(!has(t, m)){
            // TODO: is this considered good practice with a container?
            while(has(sil[__children__], m)){
                cut(sil[__children__], m);
            }
        }
    });

    if(t !== sil[__state__]){
        sil[__push__]({ done: false, value: t });
    }

    return t;
}

// an optic wrapping the standard pluck optic to
// activate silhouette streams on change detection
// TODO: I should probably pass state through? rework contort to see
export function traverse(member){
    return function* traverse({ sil, action }){
        let state = sil.state;
        let fragment = yield { 
            sil: sil.select(member),
            state: get(state, member),
            action,
        };
        if(get(state, member) !== fragment){
            state = clone(state);
            set(state, member, fragment);
            sil[__push__]({ value: state, done: false });
        }
        return state;
    };
}


export let assert = ({ state, sil, val }) => __assert__(state, sil, val);
function __assert__(state, sil, val){

    if(state === val){
        return val;
    } else if(state === undefined || state != sil.state){
        sil[__push__]({ value: val, done: false });
        return val;
    } else {
        let ret = members(val).reduce((a, k) => {
            let t = a;
            if(!has(t, k)){
                if(t === sil[__state__]){
                    t = clone(t);
                }
                let c = sil.select(k);
                set(t, k, __assert__(undefined, c, val[k]));
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
    if(has(state, member)){
        let t =  clone(state);
        cut(t, member);
        sil[__push__]({ value: t, done: false });
        let c = get(sil[__children__], member);
        if(c){ c[__push__]({ done: true }); }
        cut(sil[__children__], member);
        // TODO: FIX PATH PROBLEMS
        members(sil[__children__]).forEach(m => {
            get(sil[__children__], m)[__path__][sil[__path__].length] = m;
        });
        return t;
    } else {
        return state;
    }
}