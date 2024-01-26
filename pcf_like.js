/**
 * the tiny subset of the language that just includes variables,
 * functions, pairs and two operators (they are infix)
 * 
 * see example_terms.js for spec
 */


//    ifz : number -> A -> A -> A
const ifz = x => y => z => x === 0 ? y : z;
//    fix : (A -> A) -> A
const fix = (f) => f(fix(f)); 
// const add = fix((f) => (x) => (y) => ifz(x, y, (f (x - 1) (y + 1))));
const add_nofix = f => x => y => ifz(x)(y)(f (x - 1)(y + 1));

const normal_recursive_add = x => y => {
    if(x === 0){
        return y;
    }else{
        return normal_recursive_add(x-1)(y+1);
    }
}

const pred = x => x === 0 ? 0 : x - 1;
const succ = x => x + 1;
//const Y = f => (x => f(x(x)))(x => f(x(x)));
// const Y = gen => (f => f(f)) (f => gen (x => f(f)(x)));
//        // \g.(\f.f f)(\f.g(\x.f f x)) 
// const add = Y (f => x => y => ifz(x)(y)(f(pred(x))(succ(y))));

const pair = ['a', 'b'];

console.log(pair);

const curry = x => y => z => 0;
// // 
// console.log(add(1)(1));

console.log(normal_recursive_add(10)(10));

console.log(curry(0)(0)(0));