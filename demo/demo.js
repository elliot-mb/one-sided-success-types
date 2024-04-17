import {writeFileSync, readFileSync} from 'fs';
import {Solver} from '../../ast/subset_draft/solver.js';

//console.log(readFileSync('./prog.js').toString());

const prog = readFileSync('./prog.js').toString();

await Solver.whereTypableAsOkC(prog);