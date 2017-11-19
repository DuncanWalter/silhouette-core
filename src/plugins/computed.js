
// a production middleware for treating sils
// as observables. May not belong here, so is
// not yet a build focus. May require some optics
// imfrastructure.

// computed(sil.a, sil.b, (a, b) => a + 3*b).map(v => v / 2).subscribe(v => console.log(v));