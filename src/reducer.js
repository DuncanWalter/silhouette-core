import { cycle, view } from 'vitrarius'
import { __root__ } from './symbols'
import { contort } from './optics'

// Silhouette's global reducer! Notice it references 'this';
// reducer gets bound to a class definition of Silhouette
// internally prior to plugin application, so the function is still
// effectively pure- it just has a stealth parameter
export function reducer(state = {}, action){
    if(!this.created){ return state; }
    let sil = this.prototype[__root__];
    return view(cycle(contort), { sil, action, state });
}