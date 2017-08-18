import { compose, view } from 'vitrarius'
import { __DEFINE__, __REMOVE__, __path__, __root__ } from './symbols'
import { traverse, erase, contort, repsert } from './optics'

// Silhouette's global reducer! Notice it references 'this';
// reducer gets bound to a class definition of Silhouette
// internally prior to plugin application, so the function is still
// effectively pure- it just has a stealth parameter
export function reducer(state = {}, action){
    if(!this.created){ return state; }
    let path, payload, val, sil = this.prototype[__root__];
    switch(true){
        case action[__DEFINE__]:
            ({ val, path } = action);
            let _define = compose(...path.map(traverse), repsert(val));
            return view(_define, { state, sil });

        case action[__REMOVE__]:
            ({ path } = action);
            let eraser = erase(path.pop());
            let remove = compose(...path.map(traverse), eraser);
            return view(remove, { state, sil });

        default:
            path = action[__path__] || [];
            let dispatch = compose(...path.map(traverse), contort);
            return view(dispatch, { state, sil, action });
    }
}