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
        const last = Utils.last(r.reconstruct(program));
        const untypables = [];

        const t = last.termType;
        //console.log(`${done.show()}`);
        const envAndConstrs = {'env': last.getAssms(), 'term_type': t, 'constrs': last.constrs};
        console.log(envAndConstrs);
        const result = await Solver.sendConstrsToObj(envAndConstrs);
        //console.log(pretty(result));
        untypables.push(result['term_type_assignments'].length === 0);

        //console.log(JSON.stringify(done.constrs));
        // const untypables = (await Promise.all(dones.map(async done => {
        //         const t = done.termType;
        //         console.log(`${done.show()}`);
        //         const topLvls = done.constrs.toConstraintSet();
        //         const topAndConstrs = {'term_type': t, 'top_type': topLvls, 'constrs': done.constrs};
        //         const result = await Solver.sendConstrsToObj(topAndConstrs);
        //         //console.log(pretty(result));
        //         return result['term_type_assignments'].length === 0;
        //     })));
        const untypable = untypables.reduce((x, y) => x && y, true);
        console.log(`${program}:`);
        untypables.map(x => console.log(x ? '\tUntypable' : '\tComp(Ok)'));
        if(untypable) console.log('\t\tUntypable');
        else console.log('\t\tComp(Ok)')
        return !untypable;
    }
}
