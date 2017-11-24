
const GeneratorFunction = (function*(){}).constructor;



function async(gen, val){
    let { value, done } = gen.next(val);

    if(done){
        return;
    }

    if(value instanceof Promise){
        value.resolve(v => async(gen, v));
    }
}



// production middleware for scheduling
// dispatches asynchronously using standard
// thunks or generator based asynchronous
// yielding.
export default function thunkPlugin(){
    return {
        prototype: next => function(...args){
            let request = args.pop();
            switch(true){
                case request instanceof Object:{
                    next.call(this, ...args, request);
                };  
                case request instanceof GeneratorFunction:{
                    async(request.call(this, next.bind(this), ...args), this);
                };
                case request instanceof Function:{
                    request(next.bind(this, ...args));
                };     
            }
        }
    }
}