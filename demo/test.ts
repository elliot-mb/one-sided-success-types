
const tenOrId = lTOrGTZ => {
    return lTOrGTZ <= 0 ? x => x : 10;
}
const eleven = tenOrId(1) + 1;
/**
 * Operator '+' cannot be applied to types
 *  'number | ((x: any) => any)' and 'number'.
 */

const id = x => x;
const funcGoesWrongWhenRun = y => id + id;
const three = 2 + 1;
/**
 * Operator '+' cannot be applied to types
 *  '(x: any) => any' and '(x: any) => any'.
 */

//both of these represent what happens when we apply the principles of
//a static type system to a dynamically typed interpreted language 
// basically: even though these programs work they are typed by script such
// that they do not.