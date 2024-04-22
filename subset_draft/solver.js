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
        return Solver.spawnGetString('python3', ['/home/elliot/Documents/computer-science/year-3/tb2/individual-project/ast/subset_draft/wrapper_z3.py', '-cf', Solver.transferFile]);
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
        builder = builder.replace('True', 'true');
        builder = builder.replace('False', 'false');
        return builder;
    }
    
    static toArrowJSTy = jsty => {
        if(typeof(jsty) !== typeof('string')) throw Utils.makeErr('toArrowJSTy: jsty must be a string');
        let noTo = jsty.replace(/To/g, '');
        // if(noTo[0] === '(' && noTo[noTo.length - 1] === ')'){
        //     noTo = noTo.substring(1);
        //     noTo = noTo.substring(0, noTo.length - 1);
        // }
        return noTo.replace(/,/g, ' ->'); //add a space prior
    }

    static okC = 'Comp(Ok)';

    static isTypableAsOkC = async (program) => {
        return (await Solver.whereTypableAsOkC(program)).length !== 0;
    }

    static whereTypableAsOkC = async (program) => {
        const NO_LINES = -1;
        const r = new Reconstructor();
        //const program = '0 <= 0 ? (x => x) : 0';//'x => x(0)';//'x => (x <= 0 ? (x => x) : (y => y(x => x)))';
        const judgementAndEnv = r.reconstruct(program);
        if(judgementAndEnv === null){
            console.log('empty program');
            return NO_LINES;
        }
        const judgement = judgementAndEnv['judgement'];
        //const ignoredJudgements = judgementAndEnv['ignored']; 
        const env = judgementAndEnv['delta_assms'];

        const t = judgement.termType;
        //console.log(`${judgement.show()}`);
        const envAndConstrs = {'env': env, 'term_type': t, 'constrs': judgement.constrs};
        //console.log(envAndConstrs);
        const result = await Solver.sendConstrsToObj(envAndConstrs);
        const varAssignments = result['term_type_assignments'];
        const anyFails = result['fails_at'];

        console.log(`${program}`);
        Object.keys(varAssignments)
            .map((k, i) => {
                console.log(`\t\t${k} :\n ${ false && anyFails.length > 0 && i > anyFails[0] 
                ? 'Unknown'
                : varAssignments[k].length === 0 
                        ? 'Untypable' 
                        : varAssignments[k].map(jsty => `\t\t\t${Solver.toArrowJSTy(jsty)}\n`)}`);
            });
        if(anyFails.length !== 0) console.log(`\t\tIll-typed and fails at ${anyFails}`);
        else console.log(`\t\tInconclusive`); //we dont handle the case where individual terms evalute without assignment
        //if(anyFails.length !== 0) console.log(`First fails on line ${anyFails[0]}`);
        return anyFails;
    }
}
