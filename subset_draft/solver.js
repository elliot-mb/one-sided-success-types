import { modRequire } from './module_require.js';
import { Utils } from './utils.js';
import { Reconstructor } from './reconstructor.js';
import { pretty } from './wrapper_acorn.js';
import {Constraint} from './constraint.js';
import {writeFileSync} from 'fs';
// import {}

const { spawn } = modRequire('node:child_process');

export class Solver{

    static transferFile = 'python_subp_constraints.json';

    static spawnGetString = (program, args) => {

        const proc = spawn(program, args);
        
        //prints errors
        proc.stderr.on('data', (response) => console.log(response.toString()));
    
        proc.on('close', (code, signal) => {
            //console.log(`spawnGetString: program '${program}' emitted signal ${signal} threw code ${code}`);
            if(code !== 0){
                throw Utils.makeErr(`spawnGetString: program '${program}' emitted signal ${signal} threw code ${code}`);
            }
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

    static sendConstraints = async (constraints) => {
        if(typeof(constraints) !== 'string') throw Utils.makeErr('sendConstraints: must be a string');
        writeFileSync(Solver.transferFile, constraints);
        return Solver.spawnGetString('python3', ['./wrapper_z3.py', '-cf', Solver.transferFile]);
    }

    static sendConstrsToObj = async (constraints) => {
        const resp = await Solver.sendConstraints(JSON.stringify(constraints));
        //console.log(resp);
        return JSON.parse(Solver.pyDictToJSON(resp));
    }
    
    static pyDictToJSON = (dictStr) => {
        let builder = "";
        for(let i = 0; i < dictStr.length; i++) {
            const c = dictStr[i]
            builder += (c === '\'' ? '"' : c);
        }
        return builder;
    }
    

    static isTypableAsOkC = async (program) => {
        const r = new Reconstructor();
        //const program = '0 <= 0 ? (x => x) : 0';//'x => x(0)';//'x => (x <= 0 ? (x => x) : (y => y(x => x)))';
        const done = r.reconstruct(program);
        //console.log(JSON.stringify(done.constrs));
        const t = done.termType;
        //console.log(`${done.show()}`);
        const topLvls = done.constrs.toConstraintSet();
        const topAndConstrs = {'term_type': t, 'top_type': topLvls, 'constrs': done.constrs};
        const result = await Solver.sendConstrsToObj(topAndConstrs);
        //console.log(pretty(result));
        console.log(`${program}:`);
        const typeStrings = result['term_type_assignments'];
        const untypable = typeStrings.length === 0;
        typeStrings.map(x => console.log(`\t${x}`));
        if(untypable) console.log('\tUntypable');
        return !untypable;
    }
}
