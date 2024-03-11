import { modRequire } from './module_require.js';
import { Utils } from './utils.js';
import { Reconstructor } from './reconstructor.js';
import { pretty } from './wrapper_acorn.js';

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

const procTest = () => {

    const proc = spawn('python3', ['./wrapper_z3.py', '-constraints', {money: "bags"}]);

    proc.on('error', (err) => {
        throw Utils.makeErr(`wrapper_z3.js: ${err}`);
    });
    
    proc.stdout.on('data', (data) => {
        console.log((data.toString()));
    })
    spawnGetString('python3', ['./wrapper_z3.py', '-constraints', 'money']).then(r => console.log(r), err => Utils.makeErr(err));

}

const sendConstraints = (constraints) => {
    //if(typeof(constraints) !== 'object') throw Utils.makeErr('sendProgramObject: argument \'object\' appears to not be of type object');
    // Utils.isTypeOrCrash(orer, )
    if(typeof(constraints) !== 'string') throw Utils.makeErr('sendConstraints: must be a string');
    return spawnGetString('python3', ['./wrapper_z3.py', '-constraints', constraints]);
}

const sendConstrsToObj = async (constraints) => {
    const resp = await sendConstraints(JSON.stringify(constraints));
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

const test = () => {
    const r = new Reconstructor();
    const program = '1 + (x => x)';//'x => x(0)';//'x => (x <= 0 ? (x => x) : (y => y(x => x)))';
    const done = r.reconstruct(program);
    const t = done.termType;
    console.log(`${done.show()}`);
    const topAndConstrs = {'top_type': t, 'constrs': done.constrs};
    //console.log(r.reconstruct(program).constrs);
    sendConstraints(JSON.stringify(topAndConstrs))
        .then(resp => console.log(resp))
        .then(resp => {
            sendConstrsToObj(topAndConstrs)
            .then(
                resp => {   
                    console.log(pretty(resp));
                    const solns = resp.sol;
                    for(let i = 0; i < solns.length; i++){
                        let tShow = t.show();
                        const soln = solns[i];
                        const types = Object.keys(soln);
                        types.map(t => {
                            tShow = tShow.replace(t, soln[t])
                        });
                        console.log(`${program} : ${tShow}`);
                    }
                },
                err => console.error(`test: ${err}`)
            );
        });
}

test();
//procTest();