import {modRequire} from './module_require.js';


/**
 * idiom for importing z3 solver 
 * source: https://www.npmjs.com/package/z3-solver
 */
// import { init } from 'z3-solver';
// const {
//   Context, // High-level Z3Py-like API
// } = await init();
// const { Solver, Int, And } = new Context('main');


/**
 * examples from the api
 * https://microsoft.github.io/z3guide/programming/Z3%20JavaScript%20Examples/
 */
const main = async () => {
    const { init } = modRequire('z3-solver');
    const { Context } = await init();
    const Z3 = new Context('z3');
    const solver = new Z3.Solver();

    const x = Z3.Bool.const('x');

    solver.add(Z3.And(x, x));
    solver.check().then(result => console.log(result));
}

main();