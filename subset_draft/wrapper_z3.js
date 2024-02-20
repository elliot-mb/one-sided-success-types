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
    const { Context, ast_to_string, Z3_string } = await init();
    const Z3 = new Context('z3');


    const solver = new Z3.Solver();
    const sort = Z3.Int.sort();
    const x = Z3.Int.const('x');
    const y = Z3.Int.const('y');
    const g = Z3.Function.declare('g', sort, sort);
    const conjecture = Z3.Implies(x.eq(y), g.call(g.call(x)).eq(g.call(y)));
    solver.add(Z3.Not(conjecture));
    solver.check()
    .then((result) => {
        console.log(result);
        solver.model().ptr;
    } );













    // const [tie, shirt] = [Z3.Bool.const('tie'), Z3.Bool.const('shirt')];
    // console.log(JSON.stringify(await Z3.solve(Z3.Or(tie, shirt), Z3.Implies(tie, shirt), Z3.Or(tie, shirt))));
    // const solver = new Z3.Solver();

    // const x = Z3.Bool.const('x');
    // const y = Z3.Bool.const('y');

    // solver.add(Z3.And(x, y));
    // console.log(await solver.check());
    // console.log(JSON.stringify(solver));
    // Z3_string(x);

    // // const solver = new Z3.Solver();

    // // const x = Z3.Bool.const('x');

    // // solver.add(Z3.And(x, x));
    // // solver.check()
    // // .then(result => {
    // //     console.log(result);
    // //     return result;
    // // })
    // // .then(result => {
    // //     if(result === 'sat'){
    // //         solver.model();
    // //     }
    // // });



}

main();