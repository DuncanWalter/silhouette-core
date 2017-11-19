
const GeneratorFunction = (function*(){}).constructor;

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
                    throw new Error('Generator scheduling not yet implemented');
                };
                case request instanceof Function:{
                    request(next.bind(this, ...args));
                };     
            }
        }
    }
}