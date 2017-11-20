import tap from 'tap'
import { create } from './index'
import { __state__ } from './symbols'


import freezePlugin from './plugins/freeze'
import thunkPlugin from './plugins/thunk'
 
tap.test('Baseline Tests', t => {
    let binds = 0;
    const sil = create({
        // testing plugin functionality
        prototype: {
            bind: next => function(...args){
                next.call(this, ...args); // TODO make the plugin application handle contextualization
                binds++;
            },
        }
    });
    t.true(sil); // 1
    // sil.define({ a: 3, b: { c: [1], d: 4 }});

    sil.bind('add initial state', s => ({ a: 3, b: { c: [1], d: 4 }}));

    t.true(sil.a); // 2
    t.true(sil.b.c); // 3
    sil.b.bind('testing remove', s => ({ d: 4 }));
    t.same(binds, 2); // 4
    t.same(sil.b.c[__state__], undefined); // 5
    t.true(sil.b.d[__state__]); // 6
    sil.b.c.bind('testing add', s => [10, 20, 30]);
    t.deepEqual(sil.b.c[__state__], [10, 20, 30]); // 7
    let incra = 0;
    let incrb = 0;

    t.equal(sil.b[__state__], sil[__state__].b); // 8

    sil.b.extend('whatever', (s, a) => {
        incrb++;
        return s;
    });
    sil.a.extend('any', 'thing', (s, a) => {
        incra++;
        return s;
    });
    sil.b.dispatch('whatever', { });
    t.equal(incrb, 1); // 9
    t.equal(incra, 0); // 10
    sil.b.dispatch('any', 'thing', 'ever', { });
    t.equal(incrb, 1); // 11
    t.equal(incra, 1); // 12

    let d = undefined;
    sil.b.c.extend('incr', v => { d = v; return v; })
    sil.b.c[0].extend('incr', v => v + 1);
    sil.dispatch('incr', {});
    t.true(d instanceof Array); // 13
    sil.dispatch('incr', {});
    t.true(d instanceof Array); // 14


    let s = create();
    s.bind('add initial state', s => ({a: [{v: 1}, 2, {v: 1}]}));
    t.true(s.a[0].v[__state__]);

    s.extend('rip', s => {
        return {a: [s.a[0], s.a[1]]};
    });
    s.dispatch('rip', {});

    // console.log(s.select('a'));
    t.false(s.a[2][__state__]);

    
    
    console.log(s);

    

    t.end();
});


tap.test('Freezer Tests', t => {
    
    t.throws(() => {
        const sil = create(freezePlugin());
        sil.bind('add initial state', s => ({ a: 3, b: { c: [1], d: 4 }}));
        sil.bind('break on action', function inner(s, a){ 
            a.s = s; 
            return s; 
        });
    });

    t.throws(() => {
        const sil = create(freezePlugin());
        sil.bind('add initial state', s => ({ a: 3, b: { c: [1], d: 4 }}));
        sil.bind('break on state', function inner(s){ 
            s.b.c = [2];
            return s; 
        });
    });

    t.end();

});