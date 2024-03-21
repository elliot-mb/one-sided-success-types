import {Utils} from './utils.js';
import { GenT, NumT, ArrowT, OkT, CompT } from './typevar.js';
import {Solver} from './solver.js';
import {Reconstructor} from './reconstructor.js';

export class Test {

    constructor(){
        this.failures = [];
        this.successes = [];
    }

    async run(){
        this.failures = [];
        /** fast test
         *         await Promise.all([
            this.testTypeEquality(),
            this.testUntypability(),
            this.testTypability(),
            this.testFreshTypes(),
            this.testCheckTypeShape()
        ]).then(r => {
            this.showFailures();
        })

         */
        await this.testTypeEquality();
        await this.testUntypability();
        await this.testTypability();
        await this.testFreshTypes();
        await this.testCheckTypeShape();
        if(this.failures.length > 0) this.showFailures();
    }

    showFailures(){
        const total = this.failures.length + this.successes.length;
        const errStr = `\x1b[31m failures (${this.failures.length}/${total}):\n \t${this.failures.join('\n\t')} \x1b[0m`;
        const sucStr = `\x1b[32m successes (${this.successes.length}/${total}):\n \t${this.successes.join('\n\t')} \x1b[0m`;
        console.log(sucStr);
        console.log(errStr);
    }   

    // 3 is the depth above here when this is called from assert to show the test 
    getNameAndLine(calledNDeep = 3){
        const failStr = new Error().stack.split('\n')[calledNDeep];
        const name = failStr.split('Test.')[1].split(' (file')[0];
        const line = failStr.split('test.js:')[1].split(':')[0];
        return {
            'name': name,
            'line': line
        };
    }

    //assert true (and add a line number and method name to list of fails)
    assert(b1){
        const {name, line} = this.getNameAndLine();
        if(!b1) {
            this.failures.push(`${name}: line ${line}`);
        }else{
            this.successes.push(`${name}: line ${line}`);
        }
    }


    testTypeEquality(){
        this.assert(new GenT('A').equals(new GenT('A')));
        this.assert(new GenT('A').equals(new GenT('B')) === false);
        this.assert(new CompT(new GenT('A')).equals(new CompT(new GenT('A'))));
        this.assert(new CompT(new OkT()).equals(new CompT(new OkT())));
        this.assert(new CompT(new ArrowT(new GenT('A'), new GenT('B')))
            .equals(new CompT(new ArrowT(new GenT('A'), new GenT('B')))));
        this.assert(new ArrowT(new CompT(new GenT('A')), new GenT('B'))
            .equals(new ArrowT(new CompT(new GenT('A')), new CompT(new GenT('B')))) === false);
        //disjointedness
        this.assert(new NumT().equals(new ArrowT(new GenT('D'), new GenT('E'))) === false);
        this.assert(new ArrowT(new GenT('D'), new GenT('E')).equals(new NumT()) === false);
        this.assert(new GenT('A').equals(new CompT(new GenT('B'))) === false);
        this.assert(new CompT(new GenT('B')).equals(new GenT('A')) === false);
    }

    async testUntypability(){ //inconclusive
        this.assert(!(await Solver.isTypableAsOkC('f => x => f(f(x))')));
        this.assert(!(await Solver.isTypableAsOkC('(f => g => f + g)')));
        this.assert(!(await Solver.isTypableAsOkC('(f => g => f + g)(0)')));
        this.assert(!(await Solver.isTypableAsOkC('(f => g => f + g)(0)(0)')));
        this.assert(!(await Solver.isTypableAsOkC('(f => g => f + g(0))(0)(x => x)')));
        this.assert(!(await Solver.isTypableAsOkC('(x => x)(0) + 0')));
        this.assert(!(await Solver.isTypableAsOkC('(x => x)')));
        this.assert(!(await Solver.isTypableAsOkC('(x => x)(0)')));
        this.assert(!(await Solver.isTypableAsOkC('(x => x)(x => x)')));
        this.assert(!(await Solver.isTypableAsOkC('0 + 0')));
    }

    async testTypability(){ //as OkC
        this.assert(await Solver.isTypableAsOkC('0(0)'));
        this.assert(await Solver.isTypableAsOkC('(x => x) + 0'));
        this.assert(await Solver.isTypableAsOkC('(x => x <= 0 ? 0 : 0)(y => y)'));
        this.assert(await Solver.isTypableAsOkC('(f => g => f + g)(0)(x => x)'));
        this.assert(await Solver.isTypableAsOkC('0 - (x => x <= 0 ? 1 : 0)'));
        this.assert(await Solver.isTypableAsOkC('(x => x) - (y => y)'));
        this.assert(await Solver.isTypableAsOkC('(f => x => 0 - f(x)(0)) <= 0 ? 0 : 0'));
    }

    async testFreshTypes(){
        const typeMap = {}; // uniques
        const count = 260;
        const prefixes = ['X', 'Y', 'Z'];
        const r = new Reconstructor();
        for(let i = 0; i < count; i++){
            prefixes.map(x => typeMap[r.getFreshVar(x)] = null);
        }
        this.assert(Object.keys(typeMap).length === count * prefixes.length);
    }

    async testCheckTypeShape(){
        this.assert(new CompT(new GenT('A')).shape() === GenT.compShape);
        this.assert(new ArrowT(new GenT('A'), new GenT('B')).shape() === GenT.arrowShape);
    }
}

const runTests = async () => {
    const tester = new Test();
    await tester.run();
}

runTests();
