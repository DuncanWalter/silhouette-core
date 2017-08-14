[![Build Status](https://travis-ci.org/DuncanWalter/silhouette.svg?branch=master)](https://travis-ci.org/DuncanWalter/silhouette)


# **Silhouette Store**

### **Handshakes & Introductions**
-----------------------

Redux and similar libraries are great at managing complex state. I'm a fan of the philosophical clarity and purity they represent. However, they are a bit picky about architecture. My redux store has more opinions than I do on how my projects should be structured. As a JavaScripter, I would like to be king of my code palace(s), so this is a nagging issue. In an attempt to either solve or justify the problem, I created Silhouette: an experimental façade over redux. Under the hood, Silhouette is powered by a redux store, so you can use redux enhancers and middleware as usual. On the surface, Silhouette exposes a higher level API than default redux. The intent is to make the state atom pattern more approachable, productive, and fun. There is, by necessity, a tradeoff in values between Redux and Silhouette. Redux enforces static definitions and machinery. Silhouette doesn't. This has consequences from all over the D&D alignment chart.

Silhouette gets its name from how it behaves as state changes. The root silhouette object will always be the same 'shape' as the state object, though it will be comprized only of other Silhouette instances (all connected to the same redux store). Each silhouette instance inherits four functions by default:

```
1) dispatch :: (type, payload) -> void      // dispatches actions to the store
2) extend :: (type, reducer) -> void        // mounts a reducer to the state tree
3) define :: (state, ...path) -> void       // asserts the 'shape' of a given silhouette
4) remove :: (...path) -> void              // an escape hatch that clears data from state
```

Using middleware, silhouettes are designed to naturally support reactive programming, so I'd expect a fifth method defined via plugin in usage.

```
5) asObservable :: () -> Observable         // take out a stream reacting to changes in state
```

### **Example Code**
--------------------

A root silhouette object is created by a global create method which accepts an optional list of plugins:

``` javascript
import { create, rxjsPlugin, reduxEnhancePlugin } from 'silhouette-store'

const sil = create( rxjsPlugin, reduxEnhancePlugin({/*/.../*/}) );

console.log(sil); // > S { }
```

Who likes increment examples? No one? Ok, have another one:

``` javascript
let step = 1;

// easiest way to mold initial state
sil.define({ value: 0, step });

// silhouette mimics the shape of state actively
console.log(sil); // > S { value: S { }, step: S { } }

// update step using sil as observable
sil.step.observe().subscribe(v => step = v);

// reducers and actions
sil.value.extend('incr', (value, action) => value + step);
sil.value.extend('decr', (value, action) => value - step);
sil.step.extend('FASTER!', (step, action) => step + 1);

// so we can see state at each update
sil.observe().subscribe(v => console.log(v)); // > { value: 0, step: 1 }

sil.dispatch('incr', {});     // > { value:  1, step: 1 }
sil.dispatch('FASTER!', {});  // > { value:  1, step: 2 }
sil.dispatch('decr', {});     // > { value: -1, step: 2 }

// dispatches work from any silhouette
sil.step.dispatch('incr', {}); // > { value:  1, step: 2 }
```



### **Contributions & Feedback**
----------------------------------

Pull requests are welcome! I will advise waiting until the core features stabilize before making contributions; it's changing frequently at the moment.

Questions and comments are always welcome!

Special thanks to Mark Erikson for critiquing and inspiring aspects of Silhouette!



### **Roadmap**
---------------

My current focus is on... 
1. supporting the redux dev-tools as completely as possible
2. getting example applications for Silhouette online
3. breaking up the core code into separate packages