

export function unify(data){
    switch(true){
        case data instanceof Array: return UnifiedArray(data);
        case data instanceof Object: return UnifiedArray(data);
        default: return UnifiedPrimitive(data);
    }
}

class UnifiedArray {

    constructor(data){
        this[Symbol.generator] = (function*(){  
            for(let i = 0; i < data.length; i++){
                yield 1;
            }
        });
    }

    get(key){
        return data[key];
    }



}

class UnifiedObject {
    
    constructor(data){
        this[Symbol.generator] = function*(){ 
            
        }
    }

}

class UnifiedPrimitive {
    
    constructor(data){
        this[Symbol.generator] = function*(){ return; }
    }

}