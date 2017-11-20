
// non-colliding class properties
export const __reducers__ = Symbol('reducers');
export const __push__ = Symbol('push');
export const __store__ = Symbol('store');
export const __root__ = Symbol('root');
export const __create__ = Symbol('create');
export const __state__ = Symbol('state');
export const __children__ = Symbol('children');
export const __value__ = Symbol('value');
export const __logger__ = (() => {
    let sym;
    try {
        console.log(new Proxy({}, {
            get(__, mem){
                sym = mem;
                throw new Error('Capturing logging symbol.');
            }
        }))
    } catch(e){   
        return sym;
    }
})();
