
// const tenOrId = lTOrGTZ => {
//     return lTOrGTZ <= 0 ? x => x : 10;
// }
// const eleven = tenOrId(1) + 1;
/**
 * Operator '+' cannot be applied to types
 *  'number | ((x: any) => any)' and 'number'.
 */

// const id = x => x;
// const funcGoesWrongWhenRun = y => id + id;
// const three = 2 + 1;
/**
 * Operator '+' cannot be applied to types
 *  '(x: any) => any' and '(x: any) => any'.
 */

//both of these represent what happens when we apply the principles of
//a static type system to a dynamically typed interpreted language 
// basically: even though these programs work they are typed by script such
// that they do not.

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

// const pair = fst => snd => get => get(fst)(snd);
// const confusedPair = pair(0)(0)(0);