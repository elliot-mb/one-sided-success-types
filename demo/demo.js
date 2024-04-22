import {writeFileSync, readFileSync} from 'fs';
import {Solver} from '../../ast/subset_draft/solver.js';

//console.log(readFileSync('./prog.js').toString());

const prog = readFileSync('./prog.js').toString();

const fails = await Solver.whereTypableAsOkC(prog);

//console.log(`fails at ${fails.reduce((acc, x) => `${acc},${x}`)}`);