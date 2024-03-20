import {Utils} from './utils.js';
import { GenT, NumT, ArrowT, OkT, CompT } from './typevar.js';
import {Solver} from './solver.js';

export class Test {

    constructor(){
        this.failures = [];
    }

    async run(){
        this.failures = [];
        await this.testTypeEquality();
        await this.testTypability();
        this.showFailures();
    }

    showFailures(){
        console.log('failures:');
        console.log(`\t${this.failures.join('\n')}`);
    }

    //assert true
    assert(b1){
        if(!b1) {
            const failStr = new Error().stack.split('\n')[2];
            const name = failStr.split('Test.')[1].split(' (file')[0];
            const line = failStr.split('test.js:')[1].split(':')[0];
            this.failures.push(`${name}: line ${line}`);
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

    async testTypability(){
        this.assert(await Solver.isTypableAsOkC('0(0)'));
        this.assert(await Solver.isTypableAsOkC('(x => x) + 0'));
        this.assert(!(await Solver.isTypableAsOkC('(x => x)(0) + 0')));
    }
}

const runTests = async () => {
    const tester = new Test();
    await tester.run();
}

runTests();
