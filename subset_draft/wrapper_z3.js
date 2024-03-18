import { modRequire } from './module_require.js';
import { Utils } from './utils.js';
import { Reconstructor } from './reconstructor.js';
import { pretty } from './wrapper_acorn.js';
import {Constraint} from './constraint.js';
// import {}

const { spawn } = modRequire('node:child_process');

/**
 * Please run this project with NodeJS in order to use the 'spawn' method for 
 * creating subprocesses
 * 
 * Please install Python3
 */

const spawnGetString = (program, args) => {

    const proc = spawn(program, args);
    
    //prints errors
    proc.stderr.on('data', (response) => console.log(response.toString()));

    proc.on('close', (code, signal) => {
        console.log(`spawnGetString: program '${program}' emitted signal ${signal} threw code ${code}`);
    });

    return new Promise(resolve => {
        proc.stdout.on('data', (response) => {
            resolve(response.toString());
        });
    }, reject => {
        proc.on('error', (err) => {
            reject(`spawnGetString: program '${program}' threw error ${err}`);
        });
    });
}

const sendConstraints = (constraints) => {
    //if(typeof(constraints) !== 'object') throw Utils.makeErr('sendProgramObject: argument \'object\' appears to not be of type object');
    // Utils.isTypeOrCrash(orer, )
    if(typeof(constraints) !== 'string') throw Utils.makeErr('sendConstraints: must be a string');
    return spawnGetString('python3', ['./wrapper_z3.py', '-constraints', constraints]);
}

const sendConstrsToObj = async (constraints) => {
    const resp = await sendConstraints(JSON.stringify(constraints));
    //console.log(resp);
    return JSON.parse(pyDictToJSON(resp));
}

const pyDictToJSON = (dictStr) => {
    let builder = "";
    for(let i = 0; i < dictStr.length; i++) {
        const c = dictStr[i]
        builder += (c === '\'' ? '"' : c);
    }
    return builder;
}

// turns python z3 type assignment into a constraint for us to use in js unification
// const pyToConstr = (pyConstr) => {
//     return new Constraint(new G)
// }

/**
 * 
 * @param {*} constr constraint object 
 * @param {*} solution python type strings
 * @returns new type string 
 */
const replaceTypeStrings = (constr, solution) => {
    const cShows = [];
    for(let i = 0; i < solution.length; i++){
        let cShow = constr.show();
        const soln = solution[i];
        const types = Object.keys(soln);
        types.map(t => { //mapping one by one should be ok because there are no type variables in the solutions
            cShow = cShow.replace(t, soln[t]);
        });
        //cShow is the original type with its variables replaced
        cShows.push(cShow);
    }
    return cShows;
}

const test = async () => {
    const r = new Reconstructor();
    const program = 'f => x => f(f(x))';//'x => x(0)';//'x => (x <= 0 ? (x => x) : (y => y(x => x)))';
    const done = r.reconstruct(program);
    //console.log(JSON.stringify(done.constrs));
    const t = done.termType;
    console.log(`${done.show()}`);
    const topLvls = done.constrs.toConstraintSet();

    console.log(topLvls);
    const topAndConstrs = {'term_type': t, 'top_type': topLvls, 'constrs': done.constrs};
    console.log(JSON.stringify(topAndConstrs));
    const result = await sendConstrsToObj(topAndConstrs);
    console.log(pretty(result));
    console.log(`${program}:`);
    const typeStrings = result['term_type_assignments'];
    typeStrings.map(x => console.log(`\t${x}`));
    if(typeStrings.length === 0) console.log('\tUntypable');

}

test();
//procTest();