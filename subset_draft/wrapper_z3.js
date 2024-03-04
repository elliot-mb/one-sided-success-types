import { modRequire } from './module_require.js';
import { Utils } from './utils.js';
import { Reconstructor } from './reconstructor.js';

const { spawn } = modRequire('node:child_process');

/**
 * Please run this project with NodeJS in order to use the 'spawn' method for 
 * creating subprocesses
 * 
 * Please install Python3
 */

const spawnGetString = (program, args) => {

    const proc = spawn(program, args);

    proc.on('error', (err) => {
        throw Utils.makeErr(`spawnGetString: program '${program}' threw error ${err}`);
    });
    
    return new Promise(resolve => {
        proc.stdout.on('data', (response) => {
            resolve(response.toString());
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
    const program = 'f => x => f(f(x))';
    console.log(`${r.reconstruct(program).constrs.show()}`);
    //console.log(r.reconstruct(program).constrs);
    sendConstrsToObj(r.reconstruct(program).constrs).then(resp => console.log(resp));
}

test();
//procTest();