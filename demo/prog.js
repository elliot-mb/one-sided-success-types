// const block1 = a => {
//     const block2 = x => {
//         const block3 = y => {
//             return x(y);
//         }
//         return block3(a);
//     };
//     return block2(a);
// }
// const twice = f => f(f);
// const succ = x => x + 1;
// const succ2 = block1(succ);
// const succSucc = twice(succ);
// // succ(0)(0); yet we can prove this is wrong
// succ(succ); //an interesting thing to not be able to prove! 
// succ(succ)(0)(0)(0); //an interesting thing to not be able to prove! 


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

// const pair = s => t => p => p(s)(t);
// const fst = s => t => s;
// const snd = s => t => t;
// const quotInner = n => d => q => { 
//     return n + 1 <= 0 
//         ? pair(q - 1)(n + d) 
//         : quotInner(n - d)(d)(q + 1);
// }
// const quot = n => d => quotInner(n)(d)(0);
// const result = quot(x => x)(12);
// const quotient = quot(quot);//result(fst);
// const remainder = 3;//result(snd);
// const threeOnThree = 3(3);

// const failed = (x => x) + (x => x);
// 0;
// 0(0);
// 0;
// 0(0);

// const f = 0(0);
// const g = 0 <= 0 ? 1 : f(1);

const delayed = go => {
    (f => x => f(x)(f(x)))(x => 0)(0);
    return go;
}
const normalRunThis = x => 0;
const shouldFail = delayed(0);