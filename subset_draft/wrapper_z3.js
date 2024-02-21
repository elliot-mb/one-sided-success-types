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
    const { Context, Z3l } = await init();
    const Z3 = new Context('z3');


    const solver = new Z3.Solver();
    const x = Z3.Bool.const('x');
    const y = Z3.Bool.const('y');
    const conjecture = Z3.And(x, y);
    solver.add(conjecture);
    const is_sat = await solver.check();
    console.log(is_sat);

    if(is_sat === 'sat'){
        const model = solver.model();

        const xSol = model.get(x);
        const ySol = model.get(y);

        //console.log(model.decls());

        const ds = model.decls();
        const vs = ds.map(d => {
            const term = d.call();
            return model.eval(term, true);
        });
        //console.log(vs);
        Promise.all(vs.map(async v => {
            const solver = new Z3.Solver();
            solver.add(v);
            const isSat = await (solver.check().then(isSat => isSat === 'sat'));
            return isSat;
        })).then(tvs => console.log(tvs));
        // console.log(truthVals);
    }



    // Z3.solve(Z3.Not(conjecture))
    // .then((model) => {
    //     console.log(model);
    //     console.log(model['x']);
    //     console.log(model.x.e);
    //     console.log(`[${model.evaluate(model.x)}]`);
    //     // Z3.display(x)
    //     // .then(result => console.log(result));
    // } );













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

await main();