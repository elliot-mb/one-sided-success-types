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




// example in paper
//
// const toolId = 0;
// const toolZero = 1;
// const toolTwice = 2;
// const multitool = which => {
//     const id = x => x;
//     const zero = 0;
//     const twice = f => x => f(f(x));
//     return which <= 0 ? id : which - 1 <= 0 ? zero : twice; 
// }
// const useId = multitool(toolId)(0);
// const useZero = 0 + multitool(toolZero);
// const useTwice = (multitool(toolTwice)(x => x - 1))(2);
// console.log(useId, useZero, useTwice);


// const fst = s => t => s;
// const snd = s => t => t;
// const pair = s => t => p => p(s)(t);
// const p1 = pair(0)(1);
// const p2 = pair(2)(3);
// const zipSumPairs = pair1 => pair2 => {
//     const e1 = pair1(fst) + pair2(fst);
//     const e2 = pair1(snd) + snd(pair2); 
//     return pair(e1)(e2);
// }
// const sumPair = zipSumPairs(p1)(p2);

// console.log(sumPair(fst), sumPair(snd));

