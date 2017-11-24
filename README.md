[![Build Status](https://travis-ci.org/DuncanWalter/silhouette-core.svg?branch=master)](https://travis-ci.org/DuncanWalter/silhouette-core)

# **Silhouette Core**

### **Handshakes & Introductions**
-----------------------

`silhouette-core` is an experimental state container designed to further decouple states and views. Silhouette gets its name from how it behaves as state changes; the root silhouette object will always be the same 'shape' as the state object, though it will be comprized only of other Silhouette instances. These instances in turn act as stores for their corresponding slices of state. A Silhouette store can also be thought of as a façade over a Redux-style store. As compared to raw `redux`, `silhouette-core` exposes a higher level API. However, both libraries support plugins/middleware equally. `silhouette-core` is lightweight by most measures, but still heavier than `redux`. Stylistically, the key distinction between the two is that `redux` enforces static machinery while `silhouette-core` can adjust behaviors. This is terrifying, and has consequences from all over the D&D alignment chart. However, it _appears_ that these adjustments can be canonically handled by middleware for view libraries like `react` or `vue`. Demonstrating this capability is a primary concern for developing `silhouette-core` further.

As mentioned earlier, Silhouette instances each manage a slice of state. Silhouettes serve as an execution context to preserve traceability and time travelling abilities. In other words, a Silhouette is nearly a [monad](https://en.wikipedia.org/wiki/Monad_(functional_programming)). Thanks to this structure, Silhouette fully supports tools like `redux-dev-tools`. 

For performance, Silhouette instances lazily mold to the shape of contained state slices. A helpful side effect of this laziness is that Silhouettes can be sliced using the standard dot and bracket syntaxes for getting object properties. For convenience, Silhouettes containing state which does not yet exist can also be selected this way.

Because they mimic data shapes, Silhouettes are more type-sensitive than standard stores. In order to remain flexible, silhouette is `container-protocol` compliant. `container-protocol` takes inspiration from the [iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) to define some basic data manipulations. That said, I haven't published `container-protocol` yet, so it is currently a hidden feature.

### **Package API**
___________

The API for `silhouette-core` is nice and small. It is one module exporting one core function: `create`. This creates a root Silhouette store. Each Silhouette instance inherits only three functions by default:

``` javascript
// Dispatches actions to the store.
// Notice that multiple 'type' arguments
// can be passed; this can replace
// action meta data like IDs.
dispatch: (...type: [any], payload: Function): void

// Mounts a reducer on the state tree.
// Can be used by view components and
// dynamically loaded modules to define
// behaviors.
extend: (...type: [any], reducer: Function): void

// Performs a monadic bind on the Silhouette.
// This is a backdoor for applying dirty 
// changes to state while preserving
// as much traceability as possible.
bind: (intent: string, operation: Function): void
```
These four functions encompass all the core functionality of the library. However, Silhouette is designed to naturally support reactive programming, so in practice I'd expect a fifth method defined using a plugin.

``` javascript
// create a stream reacting to changes in state
asObservable: (): Observable     
```


### **Ecosystem**
_________________

Plugins are a first class citizen in Silhouette. Everything from the Silhouette prototype to the data store's functions can be extended using the middleware pattern derived [here](https://redux.js.org/docs/advanced/Middleware.html). So far, here are the plugins made for Silhouette that I am aware of:

- __`rxjsPlugin`__: the RXJS plugin is defined in its own package, `silhouette-plugin-rxjs`. It adds the ability to view the changing state behind a Silhouette as an observable stream (technically a behavior subject). The RXJS plugin takes advantage of reactive hooks in Silhouette to automatically handle stream subscriptions and schedule pushes.

- __`reduxPlugin`__: The Redux plugin is defined in its own package, `silhouette-plugin-redux`. It allows redux middleware and stores to be embedded into Silhouettes. Silhouette fully supports `redux-dev-tools`, `redux-logger`, etc. Additionally, existing redux stores can be integrated into Silhouettes using an alternate plugin found in the same module.

- __`freezePlugin`__: The freeze plugin is exported from `silhouette-core`. It disallows developers from mutating states and actions inappropriately.

- __`thunkPlugin`__: The thunk plugin is exported from `silhouette-core`. It performs the same tasks as redux-thunk. Additionally, the thunk plugin can handle generator functions for sequencing asynchronous actions.

Currently, I'm also working on `vue` and `react` plugins to seamlessly integrate Silhouette stores. Between `silhouette-core`, the packages above, and `silhouette` (the quick-start package), there are probably more plugins than people in the Silhouette community.


### **Example Code**
--------------------

A root silhouette object is created by a global create method which accepts an optional list of plugins:

``` javascript
import { create } from 'silhouette-core'
import rxjsPlugin from 'silhouette-plugin-rxjs'

const sil = create( rxjsPlugin() );

console.log(sil); 
// > S {[object Object]}
```

For demonstration, here is the obligatory counter:

``` javascript
// The easiest way to add initial state
// without using plugins is via a bind.
sil.bind('Initial State', state => { value: 0, step: 1 });

// Silhouettes lazily mimic the shape of
// state contained within and expose no
// direct accessors to that state, so logging
// will only reflect the type of internal state.
console.log(sil); 
// > S {[object Object]}

// Instead, we track slices of state
// as observables. Here, we create 
// a stream of step values.
const step = sil.step.stream;

sil.value.extend('INCR', (value, action) => value + step.value);
sil.value.extend('DECR', (value, action) => value - step.value);
sil.step.extend('FASTER!', (step, action) => step + 1);

// We'll log state whenever
// it changes for explicitness.
sil.asObservable().subscribe(v => console.log(v)); 
// > { value: 0, step: 1 }

sil.dispatch('INCR', {});    // > { value:  1, step: 1 }
sil.dispatch('FASTER!', {}); // > { value:  1, step: 2 }
sil.dispatch('DECR', {});    // > { value: -1, step: 2 }

// dispatches work from any silhouette
sil.step.dispatch('INCR', {}); // > { value:  1, step: 2 }

// Action and reducer types 
// are variadic in Silhouette. 
// This lets us pass metadata 
// and make contrived examples.
sil.step.extend('RESET', 'STEP', (step, action) => 1));

// In this contrived example,
// our reducer is only triggered
// when the action types match
// (or overstep) the whole type list
sil.dispatch('RESET', {});
sil.dispatch('RESET', 'STEP', {}); // > { value: 2, step: 1 }
sil.dispatch('INCR', 'EXTRA', {}); // > { value: 3, step: 1 }

```



### **Contributions & Feedback**
--------------------------------

Questions and comments are more than welcome; feedback is how the library gets better.

If you want to make plugins for Silhouette, go for it! The more the merrier, and the plugin API is stable. You'll probably want to ask [me](https://github.com/DuncanWalter) for help getting started- I'll get back to you as soon as I can.

I advise waiting to contribute to `silhouette-core` itself until the features stabilize; it's still changing frequently right now.

Special thanks to Mark Erikson for critiquing and inspiring aspects of Silhouette.


### **Roadmap**
---------------

My current focus is on... 
1. Creating `vue` middleware that integrates with Silhouette
2. Getting an example application for Silhouette online
4. Publishing documentation for `container-protocol`