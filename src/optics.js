import { Container } from 'vitrarius'
import { __reducers__, __push__, __root__, __state__, __children__, __id__ } from './symbols'

let { get, set, cut, clone, has, members } = Container;

export function* contort(crumb){
    let reducer, { state, sil, action } = crumb;

    reducer = action[__reducers__](sil);
    state = reducer ? reducer(state, action) : state;
    
    if(state === undefined && crumb.state !== undefined){
        throw new Error('Reducer returned undefined; are you missing a return statement?');
    } else if(state === undefined){
        return undefined;
    }

    let children = sil[__children__];
    
    if(children){
        let cloned = false;
        let fragment;
        for(let k of members(children)){
            crumb.state = get(state, k);
            crumb.sil = get(children, k);
            fragment = crumb.sil ? yield crumb : crumb.state;
            if(fragment !== get(state, k)){
                if(!cloned){ 
                    state = clone(state); 
                    cloned = true;
                }
                set(state, k, fragment);
            }
            if(!has(state, k)){
                // TODO: is this considered good practice with a container?
                while(has(children, k)){
                    get(children, k)[__push__]({ done: true });
                    cut(children, k);
                }
            }
        };
    }

    if(state !== sil[__state__]){
        sil[__push__]({ done: false, value: state });
    }

    return state;
}