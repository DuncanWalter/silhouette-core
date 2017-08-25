(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === "object" && typeof module === "object") module.exports = factory(require("vitrarius")); else if (typeof define === "function" && define.amd) define([ "vitrarius" ], factory); else if (typeof exports === "object") exports["silhouette"] = factory(require("vitrarius")); else root["silhouette"] = factory(root["vitrarius"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_0__) {
    return function(modules) {
        var installedModules = {};
        function __webpack_require__(moduleId) {
            if (installedModules[moduleId]) {
                return installedModules[moduleId].exports;
            }
            var module = installedModules[moduleId] = {
                i: moduleId,
                l: false,
                exports: {}
            };
            modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
            module.l = true;
            return module.exports;
        }
        __webpack_require__.m = modules;
        __webpack_require__.c = installedModules;
        __webpack_require__.d = function(exports, name, getter) {
            if (!__webpack_require__.o(exports, name)) {
                Object.defineProperty(exports, name, {
                    configurable: false,
                    enumerable: true,
                    get: getter
                });
            }
        };
        __webpack_require__.n = function(module) {
            var getter = module && module.__esModule ? function getDefault() {
                return module["default"];
            } : function getModuleExports() {
                return module;
            };
            __webpack_require__.d(getter, "a", getter);
            return getter;
        };
        __webpack_require__.o = function(object, property) {
            return Object.prototype.hasOwnProperty.call(object, property);
        };
        __webpack_require__.p = "";
        return __webpack_require__(__webpack_require__.s = 2);
    }([ function(module, exports) {
        module.exports = __WEBPACK_EXTERNAL_MODULE_0__;
    }, function(module, exports, __webpack_require__) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        const __DEFINE__ = exports.__DEFINE__ = Symbol("__DEFINE__");
        const __REMOVE__ = exports.__REMOVE__ = Symbol("__REMOVE__");
        const __path__ = exports.__path__ = Symbol("path");
        const __reducers__ = exports.__reducers__ = Symbol("reducers");
        const __push__ = exports.__push__ = Symbol("push");
        const __store__ = exports.__store__ = Symbol("store");
        const __root__ = exports.__root__ = Symbol("root");
        const __create__ = exports.__create__ = Symbol("create");
    }, function(module, exports, __webpack_require__) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.symbols = undefined;
        exports.create = create;
        var _vitrarius = __webpack_require__(0);
        var _symbols = __webpack_require__(1);
        var __symbols__ = _interopRequireWildcard(_symbols);
        var _reducer = __webpack_require__(3);
        function _interopRequireWildcard(obj) {
            if (obj && obj.__esModule) {
                return obj;
            } else {
                var newObj = {};
                if (obj != null) {
                    for (var key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
                    }
                }
                newObj.default = obj;
                return newObj;
            }
        }
        let symbols = exports.symbols = __symbols__;
        function diff(pat, trg) {
            if (!(pat instanceof Object || pat instanceof Array)) {
                return trg !== undefined;
            }
            return Object.keys(pat).reduce((a, k) => a && trg[k] && diff(pat[k], trg[k]), trg !== undefined);
        }
        function syncQueue() {
            let active = false;
            let next = {};
            let last = next;
            return {
                enqueue(action) {
                    last.value = action;
                    last.next = {};
                    last = last.next;
                },
                forEach(fun) {
                    if (active) {
                        return;
                    }
                    active = true;
                    while (next.next) {
                        fun(next.value);
                        next = next.next;
                    }
                    active = false;
                }
            };
        }
        function defineSilhouette() {
            let actionQueue = syncQueue();
            class Silhouette {
                [_symbols.__create__](parent, member) {
                    let sil = new Silhouette();
                    sil[_symbols.__path__] = parent ? [ ...parent[_symbols.__path__], member ] : [];
                    sil[_symbols.__reducers__] = {};
                    if (parent !== undefined) {
                        parent[member] = sil;
                    }
                    return sil;
                }
                define(val, ...path) {
                    if (!(0, _vitrarius.view)((0, _vitrarius.compose)(...path.map(k => (0, _vitrarius.lens)(o => o[k], (o, r) => r)), diff.bind(null, val)), this)) {
                        actionQueue.enqueue({
                            type: "__DEFINE__",
                            [_symbols.__DEFINE__]: true,
                            val: val,
                            path: [ ...this[_symbols.__path__], ...path ]
                        });
                        actionQueue.forEach(this[_symbols.__store__].dispatch);
                    }
                }
                remove(...path) {
                    actionQueue.enqueue({
                        type: "__REMOVE__",
                        [_symbols.__REMOVE__]: true,
                        path: [ ...this[_symbols.__path__], ...path ]
                    });
                    actionQueue.forEach(this[_symbols.__store__].dispatch);
                }
                dispatch(type, payload) {
                    actionQueue.enqueue(Object.assign({
                        type: type
                    }, payload));
                    actionQueue.forEach(this[_symbols.__store__].dispatch);
                }
                extend(type, reducer, compose = false) {
                    this[_symbols.__reducers__][type] = reducer;
                }
                [_symbols.__push__]() {}
            }
            return Silhouette;
        }
        function applyPlugin(base, plugin) {
            Reflect.ownKeys(plugin).forEach(key => {
                if (plugin[key] instanceof Function) {
                    base[key] = plugin[key](base[key]);
                } else if (plugin[key] instanceof Object) {
                    base[key] = applyPlugin(base[key] || {}, plugin[key]);
                } else {
                    throw new Error("The plugin provided contained terminal properties which were not middleware functions.");
                }
            });
            return base;
        }
        function create(...plugins) {
            let Silhouette = defineSilhouette();
            let namespace = {
                Silhouette: Silhouette,
                prototype: Silhouette.prototype,
                reducer: _reducer.reducer.bind(Silhouette),
                createStore(reducer) {
                    let state = {};
                    return {
                        dispatch(action) {
                            state = reducer(state, action);
                        }
                    };
                },
                createSil(store) {
                    let sil = namespace.Silhouette.prototype[_symbols.__create__]();
                    namespace.Silhouette.prototype[_symbols.__store__] = store;
                    namespace.Silhouette.prototype[_symbols.__root__] = sil;
                    namespace.Silhouette.created = true;
                    return sil;
                }
            };
            plugins.reverse().forEach(plugin => {
                applyPlugin(namespace, plugin, namespace);
            });
            let store = namespace.createStore(namespace.reducer);
            return namespace.createSil(store);
        }
    }, function(module, exports, __webpack_require__) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.reducer = reducer;
        var _vitrarius = __webpack_require__(0);
        var _symbols = __webpack_require__(1);
        var _optics = __webpack_require__(4);
        function reducer(state = {}, action) {
            if (!this.created) {
                return state;
            }
            let path, payload, val, sil = this.prototype[_symbols.__root__];
            switch (true) {
              case action[_symbols.__DEFINE__]:
                ({val: val, path: path} = action);
                let _define = (0, _vitrarius.compose)(...path.map(_optics.traverse), (0, _optics.repsert)(val));
                return (0, _vitrarius.view)(_define, {
                    state: state,
                    sil: sil
                });

              case action[_symbols.__REMOVE__]:
                ({path: path} = action);
                let eraser = (0, _optics.erase)(path.pop());
                let remove = (0, _vitrarius.compose)(...path.map(_optics.traverse), eraser);
                return (0, _vitrarius.view)(remove, {
                    state: state,
                    sil: sil
                });

              default:
                path = action[_symbols.__path__] || [];
                let dispatch = (0, _vitrarius.compose)(...path.map(_optics.traverse), _optics.contort);
                return (0, _vitrarius.view)(dispatch, {
                    state: state,
                    sil: sil,
                    action: action
                });
            }
        }
    }, function(module, exports, __webpack_require__) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.contort = contort;
        exports.traverse = traverse;
        exports.repsert = repsert;
        exports.erase = erase;
        var _vitrarius = __webpack_require__(0);
        var _symbols = __webpack_require__(1);
        function contort({state: state, sil: sil, action: action}) {
            let transitional = state;
            if (sil[_symbols.__reducers__][action.type]) {
                transitional = sil[_symbols.__reducers__][action.type](state, action);
            }
            if (transitional === undefined) {
                throw new Error("Reducer returned undefined; are you missing a return statement?");
            }
            if (transitional !== state) {
                Object.keys(sil).forEach(key => {
                    if (!transitional.hasOwnProperty(key)) {
                        sil[key][_symbols.__push__]({
                            done: true
                        });
                        delete sil[key];
                    }
                });
                Object.keys(transitional).forEach(key => {
                    if (!sil.hasOwnProperty(key)) {
                        sil[_symbols.__create__](sil, key);
                    }
                });
            }
            let itr = Object.keys(transitional)[Symbol.iterator]();
            let fun = frag => {
                let member = itr.next().value;
                return {
                    state: frag,
                    action: action,
                    sil: sil[member] || sil[_symbols.__create__](sil, member)
                };
            };
            let final = (0, _vitrarius.view)((0, _vitrarius.compose)((0, _vitrarius.each)(), fun, contort), transitional);
            if (final != state) {
                sil[_symbols.__push__]({
                    done: false,
                    value: final
                });
            }
            return final;
        }
        function traverse(member) {
            return (0, _vitrarius.optic)(({state: state, sil: sil, action: action}, next) => {
                return (0, _vitrarius.view)((0, _vitrarius.compose)(member, fragment => {
                    if (!sil[member]) {
                        sil[_symbols.__create__](sil, member);
                    }
                    let ret = next({
                        state: fragment || {},
                        sil: sil[member],
                        action: action
                    });
                    if (ret !== state) {
                        sil[member][_symbols.__push__]({
                            done: false,
                            value: ret
                        });
                    }
                    return ret;
                }), state);
            });
        }
        function repsert(val) {
            return (0, _vitrarius.optic)(({state: state, sil: sil}) => {
                Object.keys(val).forEach(key => {
                    if (!sil || !sil.hasOwnProperty(key)) {
                        sil[_symbols.__create__](sil, key);
                        (0, _vitrarius.view)(repsert(val[key]), {
                            state: undefined,
                            sil: sil[key]
                        });
                    }
                });
                if (val !== state) {
                    sil[_symbols.__push__]({
                        done: false,
                        value: val
                    });
                }
                return val;
            });
        }
        function erase(member) {
            return (0, _vitrarius.optic)(({state: state, sil: sil}) => {
                let _state = state;
                if (state.hasOwnProperty(member)) {
                    _state = Object.keys(state).reduce((a, k) => {
                        a[k] = state[k];
                        return a;
                    }, {});
                    delete _state[member];
                    sil[member][_symbols.__push__]({
                        done: true
                    });
                    delete sil[member];
                }
                return _state;
            });
        }
    } ]);
});