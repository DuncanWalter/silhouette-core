import { cycle, view, each } from 'vitrarius'

function* freeze(obj){ 
    return yield Object.freeze(obj); 
}

let deepFreeze = cycle(freeze, each);

// dev middleware to freeze incoming 
// action requests and outgoing states.
// should crash if state is inapropriately
// modified, or if actions are being used
// as smart tokens.
export default function freezePlugin(){
    return {
        reducer: next => function(state, action){
            return view(deepFreeze, next.call(this, state, view(deepFreeze, action)));
        }
    }
}