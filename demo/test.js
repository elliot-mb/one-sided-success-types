// const pair = s => t => p => p(s)(t);
// const fst = s => t => s;
// const snd = s => t => t;
// const divInner = n => d => q => { 
//     const lastQ = q - 1;
//     const nextQ = q + 1;
//     const lastR = n + d;
//     const nextR = n - d;
//     return n + 1 <= 0 ? pair(lastQ)(lastR) : divInner(nextR)(d)(nextQ);
// }
// const div = n => d => divInner(n)(d)(0);
// const result = div(423)(12);

// const tenOrId = lTOrGTZ => {
//     return lTOrGTZ <= 0 ? x => x : 10;
// }
// const eleven = tenOrId(1) + 1;

// const id = x => x;
// const funcGoesWrongWhenRun = y => id + id;
// const three = 2 + 1;