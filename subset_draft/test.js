import {Utils} from './utils.js';
import { GenT, NumT, ArrowT, OkT, CompT } from './typevar.js';
import {Solver} from './solver.js';
import {Reconstructor} from './reconstructor.js';
import {toASTTrees} from './wrapper_acorn.js'

export class Test {

    constructor(){
        this.failures = [];
        this.successes = [];
        //this.crashInfo = [];
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
        await this.testLongIdentifiers();
        await this.testValidityOfNewGrammar();
        await this.testReconstrNewGrammarSucceeds();
        await this.testUntypableNewGrammar();
        await this.testTypeableNewGrammar();
        await this.testASTRequire();
        // (await Solver.isTypableAsOkC(`
        //     const pair = m => n => p => p(m)(n);
        //     const div = n => d => q => {
        //         const r = n - d; 
        //         return r + 1 <= 0 ? pair(q)(n) : div(r)(d)(q + 1);
        //     }
        //     const goodResult = div(10)(2)(0);
        // `)); //OKC which is wrong
        // (await Solver.isTypableAsOkC(`
        //     const pair = m => n => p => p(m)(n);
        //     const div = n => d => q => {
        //         return n - d + 1 <= 0 ? pair(q)(n) : div(n - d)(d)(q + 1);
        //     }
        //     const goodResult = div(10)(2)(0);
        // `)); //UNTYPABLE as expected 
        // (await Solver.isTypableAsOkC(`
        //     const diverg = n => diverg(n);
        //     diverg(0);
        // `));
        // !(await Solver.isTypableAsOkC(`
        //     const mul = x => y => {
        //         return x <= 0 ? y : y + mul(x - 1)(y);
        //     }
        //     const result = mul(2)(3);
        // `));
        await this.testProgramsRun();
        this.showFailures();
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

    didntCrash(callback){
        try{
            callback();
            return true;
        }catch(err){
            const {name, line} = this.getNameAndLine();
            console.log(`${name}: line ${line} used didCrash: '${err}'`);
            return false;
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
        this.assert(!(await Solver.isTypableAsOkC('f => x => f(f(x));')));
        this.assert(!(await Solver.isTypableAsOkC('(f => g => f + g);')));
        this.assert(!(await Solver.isTypableAsOkC('(f => g => f + g)(0);')));
        this.assert(!(await Solver.isTypableAsOkC('(f => g => f + g)(0)(0);')));
        this.assert(!(await Solver.isTypableAsOkC('(f => g => f + g(0))(0)(x => x);')));
        this.assert(!(await Solver.isTypableAsOkC('(x => x)(0) + 0;')));
        this.assert(!(await Solver.isTypableAsOkC('(x => x);')));
        this.assert(!(await Solver.isTypableAsOkC('(x => x)(0);')));
        this.assert(!(await Solver.isTypableAsOkC('(x => x)(x => x);')));
        this.assert(!(await Solver.isTypableAsOkC('0 + 0;')));
        this.assert(!(await Solver.isTypableAsOkC('1 <= 0 ? 0(0) : 0;'))); // we dont definitely know if this will go wrong! 
        this.assert(!(await Solver.isTypableAsOkC('(f => x => f(f(x)))(y => y + 1)((x => 0)(1));')));
        this.assert(!(await Solver.isTypableAsOkC('(f => x => f(f(x)))(y => x => y)(0);')));
        this.assert(!(await Solver.isTypableAsOkC('x => 0(x);')));
    }

    async testTypability(){ //as OkC
        this.assert(await Solver.isTypableAsOkC('0(0);'));
        this.assert(await Solver.isTypableAsOkC('(x => x) + 0;'));
        this.assert(await Solver.isTypableAsOkC('(x => x <= 0 ? 0 : 0)(y => y);'));
        this.assert(await Solver.isTypableAsOkC('(f => g => f + g)(0)(x => x);'));
        this.assert(await Solver.isTypableAsOkC('0 - (x => x <= 0 ? 1 : 0);'));
        this.assert(await Solver.isTypableAsOkC('(x => x) - (y => y);'));
        this.assert(await Solver.isTypableAsOkC('(f => x => 0 - f(x)(0)) <= 0 ? 0 : 0;'));
        this.assert(await Solver.isTypableAsOkC('(y => x => y(1) + y(x))(x => x + 1)((z => z <= 0 ? (x => x) : (y => y))(0));'));        
        //this.assert(await Solver.isTypableAsOkC('(f => x => f(f(x)))(y => x => y(x))(0)(0)(0)(0);')); //weird case
        this.assert(await Solver.isTypableAsOkC('(x => x(0))(0);'));
    
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

    async testLongIdentifiers(){
        this.assert(!(await Solver.isTypableAsOkC('thing => thing')));
        this.assert((await Solver.isTypableAsOkC('(cannotBeNum => cannotBeNum(0))(0)')));
    }

    async testValidityOfNewGrammar(){
        this.assert(this.didntCrash(() => toASTTrees('const f = x => x;', false, true)));
        this.assert(this.didntCrash(() => toASTTrees(
           `const f = x => x; 
            const g = y => y;`
            , false, true)));
        this.assert(this.didntCrash(() => toASTTrees(
           `const f = x => {
                return x;
            };`
            , false, true)));
        this.assert(this.didntCrash(() => toASTTrees(
           `const f = x => {
                const c = 1; 
                return c + x;
            };`
            , false, true)));
        this.assert(this.didntCrash(() => toASTTrees(
           `const a = 1; 
            const b = 2; 
            const c = a + b;`
            , false, true)));
    }

    async testReconstrNewGrammarSucceeds(){
        const r = new Reconstructor();
        this.assert(this.didntCrash(() => r.reconstruct('const f = 0; const g = 0;')));
        this.assert(this.didntCrash(() => r.reconstruct(
           `const f = x => {return x};
            const g = f(0);`
        )));
        this.assert(this.didntCrash(() => r.reconstruct(
            `const f = x => {
                const h = y => {
                    const z = y + 1;
                    return z;
                }
                const w = h(x);
                return w;
            }
            const g = f(0);`
        )));
        this.assert(this.didntCrash(() => r.reconstruct(`
            const mul = x => y => {
                return x <= 0 ? y : y + mul(x - 1)(y);
            }
        `)));
    }

    async testUntypableNewGrammar(){

        this.assert(!(await Solver.isTypableAsOkC(`
            const x = 0;
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            const x = y => y;
            const z = w => {
                return x(w);
            }
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            const x = 0;
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            x => x
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            const x = y => y;
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            const mul = x => y => {
                return x <= 0 ? y : y + mul(x - 1)(y);
            }
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            const mul = x => y => {
                return x <= 0 ? y : y + mul(x - 1)(y);
            }
            const result = mul(2)(3);
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            const pair = m => n => p => p(m)(n);
            const div = n => d => q => {
                const r = n - d; 
                return r + 1 <= 0 ? pair(q)(n) : div(r)(d)(q + 1);
            }
            const goodResult = div(10)(2)(0);
        `))); 
        this.assert(!(await Solver.isTypableAsOkC(`
            const pleaseDontRunMe = x => {
                0;
            }
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            const fst = x => y => x;
            const snd = x => y => y;
            const pair = m => n => p => p(m)(n);
            const listZeros = pair(0)(pair(0)(pair(0)(pair(0)(0))));
            const head = fst;
            listZeros(head);
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            //this example is interesting because it shows that partially applied functions dont go wrong
            const boomPair = m => n => p => 1(x => x) - 1(0)(0)(m)(n);
            const listZeros = boomPair(0)(boomPair(0)(boomPair(0)(boomPair(0)(0))));
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            const pfst = s => t => s;
            const psnd = s => t => t;
            const qfst = q => r => s => t => q;
            const qsnd = q => r => s => t => r;
            const qtrd = q => r => s => t => s;
            const qfrt = q => r => s => t => t;
            const quad = q => r => s => t => p => p(q)(r)(s)(t);
            const pair = r => s => p => p(r)(s);
            const toTwoPairs = inQuad => {
                const p1 = pair(inQuad(qfst))(inQuad(qsnd));
                const p2 = pair(inQuad(qtrd))(inQuad(qfrt));
                return pair(p1)(p2);
            }
            const myQuad = quad(0)(1)(2)(3);
            const firstPair = toTwoPairs(myQuad)(pfst);
            const sndPair = toTwoPairs(myQuad)(psnd);
        `)));
        //chu wei   poster 
        //pragye gurrung???? poster 
    }

    async testTypeableNewGrammar(){
        // this.assert(await Solver.isTypableAsOkC(`
        //     const mul = x => y => {
        //         return 0(x) <= 0 ? y : y + mul(x - 1)(y);
        //     }
        // `));
        this.assert(await Solver.isTypableAsOkC(`
            const earlyFail = (x => 0)(0)(0);
            const two = 1 + 1; //there are no constraints that can solve those above so all following are affected
            two + 1;
        `))
        this.assert(await Solver.isTypableAsOkC(`
            const zeroer = x => y => {
                return 0(x) <= 0 ? 0 : 0;
            }
            zeroer(0)(0);
        `)); //actually using the function that goes wrong causes OkC
        this.assert(await Solver.isTypableAsOkC(`
            const mul = 0(0);
        `));
        this.assert(await Solver.isTypableAsOkC(`
            const pair = m => n => p => p(m)(n);
            const div = n => d => q => {
                const r = n - d; 
                return r + 1 <= 0 ? pair(q)(n) : div(r)(d)(q + 1);
            }
            
            const badResult = div(x => x)(10)(0);
        `)); //if we dont use the function its fine!
        this.assert(await Solver.isTypableAsOkC(`
            const fst = x => y => x;
            const pair = m => n => p => 0(m)(n); //nb zero application when used
            const listZeros = pair(0)(pair(0)(pair(0)(pair(0)(0))));
            listZeros(fst);
        `));
        this.assert(await Solver.isTypableAsOkC(`
            const snd = x => y => y;
            const pair = m => n => p => p(m)(n);
            const confusedList = pair(0)(0)(0);
        `));
        this.assert(await Solver.isTypableAsOkC(`
            const fst = s => t => s;
            const snd = s => t => t;
            const pair = s => t => p => p(s)(t);
            const p1 = pair(0)(1);
            const p2 = pair(2)(3);
            //incorrect zipPairs function that goes wrong when used
            const zipSumPairs = pair1 => pair2 => {
                const e1 = pair1(fst) + pair2(fst);
                const e2 = pair1(snd) + snd(pair2); //mistakenly wrong way around
                return pair(e1)(e2);
            }
            const sumPair = zipSumPairs(p1)(p2);
        `));
        this.assert(await Solver.isTypableAsOkC(`
            const fst = s => t => s;
            const snd = s => t => t;
            const sndFst = snd(fst); //would reduce to t => t 
            const idPlus1 = sndFst + 1;
        `));
        this.assert(await Solver.isTypableAsOkC(`
            const boomRecursion = x => {
                return x <= 0 ? 0(boomRecursion(x - 1)) : 0(x);
            }
            boomRecursion(10);
        `));
    }

    async testASTRequire(){
        // this.assert(!this.didntCrash(() => toASTTrees(`
        //     const noReturn = x => {
        //         0;
        //         0;
        //     }
        // `)));
    }

    async testProgramsRun(){
        const goodDiv = () => {
            const pair = m => n => p => p(m)(n);
            const div = n => d => q => {
                const r = n - d; 
                return r + 1 <= 0 ? pair(q)(n) : div(r)(d)(q + 1);
            }
            const goodResult = div(10)(2)(0);
            // console.log(goodResult(x => y => x), goodResult(x => y => y));
        }
        this.assert(this.didntCrash(goodDiv));
        const header = () => {
            const fst = x => y => x;
            const snd = x => y => y;
            const pair = m => n => p => p(m)(n);
            const listZeros = pair(0)(pair(0)(pair(0)(pair(0)(0))));
            const head = fst;
            head(listZeros);
        }
        this.assert(this.didntCrash(header));
    }
}

const runTests = async () => {
    const tester = new Test();
    await tester.run();
}

runTests();
