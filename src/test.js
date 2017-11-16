import tap from 'tap'
import { create } from './index'

tap.test('silhouette tests', t => {
    let removes = 0;
    const sil = create({
        // testing plugin functionality
        prototype: {
            remove: next => function(...path){
                next.call(this, ...path); // TODO make the plugin application handle contextualization
                removes++;
            }
        }
    });
    t.true(sil); // 1
    sil.define({ a: 3, b: { c: [1], d: 4 }});
    t.true(sil.select('a')); // 2
    t.true(sil.select('b', 'c')); // 3
    sil.remove('b', 'c');
    t.same(removes, 1); // 4
    t.same(sil.b.c.state, undefined); // 5
    t.true(sil.select('b').select('d')); // 6
    sil.select('b').define([10, 20, 30], 'c');
    t.true(sil.b.c[0]); // 7
    let incra = 0;
    let incrb = 0;

    t.equal(sil.select('b').state, sil.state.b); // 8

    sil.select('b').extend('whatever', (s, a) => {
        incrb++;
        return s;
    });
    sil.select('a').extend('any', (s, a) => {
        incra++;
        return s;
    });
    sil.select('b').dispatch('whatever', { });
    t.equal(incrb, 1); // 9
    t.equal(incra, 0); // 10
    sil.select('b').dispatch('any', { });
    t.equal(incrb, 1); // 11
    t.equal(incra, 1); // 12

    let d = undefined;
    sil.select('b').select('c').extend('incr', v => { d = v; return v; })
    sil.select('b', 'c', 0).extend('incr', v => v + 1);
    sil.dispatch('incr', {});
    t.true(d instanceof Array);
    sil.dispatch('incr', {});
    t.true(d instanceof Array);


    let s = create();
    s.define({a: [{v: 1}, 2, {v: 1}]});
    t.true(s.select('a', 0, 'v'));

    s.extend('rip', s => {
        return {a: [s.a[0], s.a[1]]};
    });
    s.dispatch('rip', {});

    // console.log(s.select('a'));
    t.false(s.select('a', 2).state);

    


    t.end();
});


