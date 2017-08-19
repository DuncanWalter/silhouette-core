import tap from 'tap'
import { create } from './index'

tap.test('silhouette tests', t => {
    let removes = 0;
    const sil = create({
        // testing plugin functionality
        prototype: {
            remove: next => function(...path){
                next.call(this, ...path);
                removes++;
            }
        }
    });
    t.true(sil);
    sil.define({ a: 3, b: { c: 1, d: 4 }});
    t.true(sil.a);
    t.true(sil.b.c);
    sil.remove('b', 'c');
    t.same(removes, 1);
    t.same(sil.b.c, undefined);
    t.true(sil.b.d);
    sil.b.define([10, 20, 30], 'c');
    t.true(sil.b.c[0]);
    let incra = 0;
    let incrb = 0;
    sil.b.extend('whatever', (s, a) => {
        incrb++;
        return s;
    });
    sil.a.extend('any', (s, a) => {
        incra++;
        return s;
    });
    sil.b.dispatch('whatever', { });
    t.equal(incrb, 1);
    t.equal(incra, 0);
    sil.b.dispatch('any', { });
    t.equal(incrb, 1);
    t.equal(incra, 1);
    t.end();
});