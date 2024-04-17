// example program
// const mul = n => m => {
//     return m <= 0 ? n : n + mul(n, m - 1);
// }
// const twoTimesThree = mul(2)(3);

const fact = n => {
    return n <= 0 ? 1 : fact(n-1);
}

fact(0-2);