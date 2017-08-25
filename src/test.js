import tap from 'tap'
import { create } from './index'



// let removes = 0;
// const sil = create({
//     // testing plugin functionality
//     prototype: {
//         remove: next => function(...path){
//             next.call(this, ...path);
//             removes++;
//         }
//     }
// });
// sil.define({ a: 3, b: { c: 1, d: 4 }});
// console.log(sil);
// sil.remove('b', 'c');
// console.log(sil);
// sil.b.define([10, 20, 30], 'c');
// let incra = 0;
// let incrb = 0;
// sil.b.extend('whatever', (s, a) => {
//     incrb++;
//     return s;
// });
// sil.a.extend('any', (s, a) => {
//     incra++;
//     return s;
// });
// sil.b.dispatch('whatever', { });
// sil.b.dispatch('any', { });







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
    t.true(sil); // 1
    sil.define({ a: 3, b: { c: 1, d: 4 }});
    t.true(sil.a); // 2
    t.true(sil.b.c); // 3
    // console.log(sil);
    sil.remove('b', 'c');
    // console.log(sil);
    t.same(removes, 1); // 4
    t.same(sil.b.c, undefined); // 5
    t.true(sil.b.d); // 6
    sil.b.define([10, 20, 30], 'c');
    t.true(sil.b.c[0]); // 7
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
    t.equal(incrb, 1); // 8
    t.equal(incra, 0); // 9
    sil.b.dispatch('any', { });
    t.equal(incrb, 1); // 10
    t.equal(incra, 1); // 11
    t.end();
});


