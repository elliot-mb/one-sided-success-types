// const fst = s => t => s;
// const snd = s => t => t;
// const pair = s => t => p => p(s)(t);
// const p1 = pair(0)(1);
// const p2 = pair(2)(3);
// //incorrect zipPairs function that goes wrong when used
// const zipSumPairs = pair1 => pair2 => {
//     const e1 = pair1(fst) + pair2(fst);
//     const e2 = pair1(snd) + snd(pair2); //mistakenly wrong way around
//     return pair(e1)(e2);
// }
// const sumPair = zipSumPairs(p1)(p2);

// const snd = x => y => y;
// const pair = m => n => p => p(m)(n);
// const confusedList = pair(0)(0)(0);

// const pair = m => n => p => p(m)(n);
// const div = n => d => q => {
//     const r = n - d; 
//     return r + 1 <= 0 ? pair(q)(n) : div(r)(d)(q + 1);
// }

// const badResult = div(x => x)(10)(0);
// const boomRecursion = x => {
//     return x <= 0 ? 0(boomRecursion(x - 1)) : 0(x);
// }
// boomRecursion(10);

// const fst = x => y => x;
// const evilPair = m => n => p => 10(m)(n); //number is not a function
// const listZeros = pair(0)(pair(0)(pair(0)(pair(0)(0))));
// listZeros(fst);


const id = x => x;
const explode = x => id - 1;
const zero = id(0);

// const crashme = (x => x)(0)(0);

const showThing = x => {
    console.log(`"${JSON.stringify({"asStr": `${x}`})}"`);
    console.log(`"${JSON.stringify({"asRaw": x})}"`);
}

showThing((x => x) + (x => x));
showThing(0 + (x => x));
showThing((x => x));