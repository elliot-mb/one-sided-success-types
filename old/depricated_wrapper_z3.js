import {modRequire} from './module_require.js';
import {Orer} from './orer.js';
import {Ander} from './ander.js';

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
 * exploring the solver and trying to get results out of it 
 */

const { init } = modRequire('z3-solver');
const { Context, Z3l } = await init();
const Z3 = new Context('z3');


/**
 * 
 * @param {*} s solver
 * @param {*} ts terms
 */
const getModels = async (s, ts) => {
    const blockTerm = (s, m, t) => s.add(t.neq(m.eval(t, true)));
    const fixTerm = (s, m, t) => s.add(t.eq(m.eval(t, true)));
    const allSmtRec = async (ts) => {
        if(await s.check() === 'sat'){
            const m = s.model();
            const result = [];
            for(let i = 0; i < ts.length; i++){
                s.push();
                blockTerm(s, m, ts[i]);
                for(let j = 0; j < i; j++){
                    fixTerm(s, m, terms[j]);
                }
                s.pop();
                result.push(...await allSmtRec(ts.slice(i)));
            }
            return result;
        }
    }
    return await allSmtRec(ts);
}


const main = async () => {
    const boolVal = async (bool) => {
        const solver = new Z3.Solver();
        solver.add(bool);
        const isSat = await (solver.check().then(isSat => isSat === 'sat'));
        return isSat;
    }

    const solver = new Z3.Solver();
    const x = Z3.Bool.const('x');
    const y = Z3.Bool.const('y');
    const conjecture = Z3.Or(x, y);
    //solver.add(conjecture);
    const allAss = [];



    // const solveAll = async (solver) => {
        
    //     const is_sat = await solver.check();
    //     console.log(is_sat);
    //     const block = []; //spread this into an or
    //     if(is_sat === 'sat'){
    //         const model = solver.model();
    //         //console.log(model.decls());
    //         const ds = model.decls();
    //         const vs = {}; 
    //         await Promise.all(ds.filter(d => d.arity() === 0).map(async d => { //list of pairs of names and vals
    //             const term = d.call(); //all declarations are evaluated
    //             const boolTerm = model.eval(term, true);
    //             block.push(Z3.Not(boolTerm));
    //             vs[d.name()] = await boolVal(boolTerm);
    //         }));
    //         allAss.push(vs);
    //         console.log(vs);
    //     }else{
    //         s
    //         return;
    //     }
    //     Promise.all(block.map(bTerm => boolVal(bTerm))).then(r => console.log(r));
    //     solver.add(Z3.Or(...block));
    //     await solveAll(solver);
    // }
    getModels(solver, conjecture).then(r => console.log(r));
}




//await main();

 
        // Promise.all(vs.map(async v => {
        //     const solver = new Z3.Solver();
        //     solver.add(v[1]);
        //     const isSat = await (solver.check().then(isSat => isSat === 'sat'));
        //     return isSat;
        // })).then(tvs => console.log(tvs));
        // console.log(truthVals);



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

// const grammarTypes = () => {
//     const solver = new Z3.Solver();
//     const JSType = Z3.Datatype('JSType'); //this does not work! 
//     JSType.declare('Num');
//     JSType.declare('Ok');
//     JSType.declare('Comp', ('val', JSType));
//     JSType.declare('To', ('lft', JSType), ('rgt', JSType));
//     const a = JSType.Const('a');
//     const b = JSType.Const('b');
//     const c = JSType.Const('c');
//     solver.add(Z3.Or(Z3.And(Z3.Eq(b, (JSType.To(a, c))), Z3.Eq(a, JSType.Num)), Z3.Eq(JSType.Ok, c)));
//     solver.check().then(r => console.log(r));
// }

//grammarTypes();