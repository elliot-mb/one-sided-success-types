import {Utils} from './utils.js';
import { GenT, NumT, ArrowT, OkT, CompT } from './typevar.js';
import {Solver} from './solver.js';
import {Reconstructor} from './reconstructor.js';
import {toASTTrees, getAllVariablesInDefn} from './wrapper_acorn.js'

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
        await this.testVariables();

        await this.testEarlyFailAt();
        await this.testBlockIgnoresStillIllTyped();
        await this.testTypabilityByRule();
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
        await this.falsePositivesWeCantShowWrong();
        await this.showSimpleRights();
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

    /**
     * tests
     */

    testVariables(){
        const allEqual = (arr1, arr2) => arr1.length == arr2.length && Utils.all(arr1.map((x, i) => x === arr2[i]));
        this.assert(allEqual(getAllVariablesInDefn(toASTTrees('const x = 0;', false, true)[0]), ['x']));
        this.assert(allEqual(getAllVariablesInDefn(toASTTrees('const xyz = x => y => z => 0;', false, true)[0]), ['xyz','x', 'y', 'z']));
        this.assert(allEqual(getAllVariablesInDefn(toASTTrees('x => y => y + x + 3;', false, true)[0]), ['x', 'y']));
        this.assert(allEqual(getAllVariablesInDefn(toASTTrees('x - 1;', false, true)[0]), ['x']));
        this.assert(allEqual(getAllVariablesInDefn(toASTTrees('const doesntNeedAny = 0;', false, true)[0]), ['doesntNeedAny']));
        this.assert(allEqual(getAllVariablesInDefn(toASTTrees(
            `const fn = x => {
                const z = f - y;
                return 6;
            };`
        , false, true)[0]), ['fn', 'x', 'z', 'f', 'y']));
        this.assert(allEqual(getAllVariablesInDefn(toASTTrees(
            `
            const quotInner = n => d => q => { 
                const lastQ = q - 1;
                const nextQ = q + 1;
                const lastR = n + d;
                const nextR = n - d;
                return n + 1 <= 0 ? pair(lastQ)(lastR) : quotInner(nextR)(d)(nextQ);
            }
            `
        , false, true)[0]), ['quotInner', 'n', 'd', 'q', 'lastQ', 'nextQ', 'lastR', 'nextR', 'pair']))
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
            const fst = x => y => x;
            const snd = x => y => y;
            const pair = m => n => p => p(m)(n);
            const listZeros = pair(0)(pair(0)(pair(0)(pair(0)(0))));
            const head = fst;
            listZeros(head);
        `)));
        //this example is interesting because it shows that partially applied functions dont go wrong
        this.assert(!(await Solver.isTypableAsOkC(`
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
        this.assert(!(await Solver.isTypableAsOkC(`
            const id = x => x;
            const explode = x => id - 1;
            const zero = id(0);
        `)))
        //chu wei   poster 
        //pragye gurrung???? poster 
    }

    async testTypeableNewGrammar(){
        // this.assert(await Solver.isTypableAsOkC(`
        //     const mul = x => y => {
        //         return 0(x) <= 0 ? y : y + mul(x - 1)(y);
        //     }
        // `));

        //there are no constraints that can solve those above so all following are affected
        this.assert(await Solver.isTypableAsOkC(`
            const earlyFail = (x => 0)(0)(0);
            const two = 1 + 1;
            two + 1;
        `))
        //actually using the function that goes wrong causes OkC
        this.assert(await Solver.isTypableAsOkC(`
            const zeroer = x => y => {
                return 0(x) <= 0 ? 0 : 0;
            }
            zeroer(0)(0);
        `)); 
        this.assert(await Solver.isTypableAsOkC(`
            const mul = 0(0);
        `));
        //if we dont use the function its fine!
        this.assert(await Solver.isTypableAsOkC(`
            const pair = m => n => p => p(m)(n);
            const div = n => d => q => {
                const r = n - d; 
                return r + 1 <= 0 ? pair(q)(n) : div(r)(d)(q + 1);
            }
            
            const badResult = div(x => x)(10)(0);
        `)); 
        //number is not a function
        this.assert(await Solver.isTypableAsOkC(`
            const fst = x => y => x;
            const pair = m => n => p => 10(m)(n); 
            const listZeros = pair(0)(pair(0)(pair(0)(pair(0)(0))));
            listZeros(fst);
        `));
        this.assert(await Solver.isTypableAsOkC(`
            const snd = x => y => y;
            const pair = m => n => p => p(m)(n);
            const confusedList = pair(0)(0)(0);
        `));
        //incorrect zipPairs function that goes wrong when used
        //mistake in snd and pair2 application order
        this.assert(await Solver.isTypableAsOkC(`
            const fst = s => t => s;
            const snd = s => t => t;
            const pair = s => t => p => p(s)(t);
            const p1 = pair(0)(1);
            const p2 = pair(2)(3);
            const zipSumPairs = pair1 => pair2 => {
                const e1 = pair1(fst) + pair2(fst);
                const e2 = pair1(snd) + snd(pair2); 
                return pair(e1)(e2);
            }
            const sumPair = zipSumPairs(p1)(p2);
        `));
         //snd(fst) would reduce to t => t 
        this.assert(await Solver.isTypableAsOkC(`
            const fst = s => t => s;
            const snd = s => t => t;
            const sndFst = snd(fst);
            const idPlus1 = sndFst + 1;
        `));
        this.assert(await Solver.isTypableAsOkC(`
            const boomRecursion = x => {
                return x <= 0 ? 0(boomRecursion(x - 1)) : 0(x);
            }
            boomRecursion(10);
        `));
    }

    async testTypabilityByRule(){
        this.assert(await Solver.isTypableAsOkC(`
            const app2 = 0(0); //Disj(T1, Comp(Ok) -> A);
        `));
        this.assert(await Solver.isTypableAsOkC(`
            const id = x => x;
            const app3 = (id)(id + id); //T2 = Comp(Ok);
        `));
        this.assert(await Solver.isTypableAsOkC(`
            const pred = x => x - 1;
            const ifZ1 = pred <= 0 ? 1 : 2; //Disj(T1, Num)
        `));
        //note the below test is untypable!
        //the body has been abstracted to a type so the derivation cannot
        //break succ down into a NumOp, meaning it will deliver a recursive
        //type instead of being able to show its Comp(Ok)
        //This is fine because we arent allowed terms in the assumptions,
        //so with the one sided system this is the best we can do.
        this.assert(!(await Solver.isTypableAsOkC(`
            const succ = x => x + 1;
            succ(succ); //A = A -> B (untypable)
        `)));
        // the below test is Comp(Ok)! its possible that
        //with terms in the assumptions we would end up with the above test
        //being Comp(Ok) too. this test shows that having access to the 
        //underlying term allows the rule system to be more expressive in
        //finding a way to prove it wrong.
        this.assert(await Solver.isTypableAsOkC(`
            (x => x + 1)(x => x + 1); // free conclusion type from NumOp2
        `));
        //T2 = T3 & T2 = X (& T3 = X)
        this.assert(await Solver.isTypableAsOkC(`
            const ifZ2 = 0 <= 0 ? (x => x + 1)(x => x + 1) : (x => x + 1)(x => x + 1); 
        `));
        this.assert(await Solver.isTypableAsOkC(`
            const okC1 = (x => x)(0(0)); //variable x goes wrong (Y1 = Comp(Ok))
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

    async testBlockIgnoresStillIllTyped(){

        this.assert(await Solver.isTypableAsOkC(`
            const fn = x => {
                0(0);
                return 0;
            }
            fn(0);
        `));

    }

    async testEarlyFailAt(){
        this.assert((await Solver.whereTypableAsOkC(`
            const pair = s => t => p => p(s)(t);
            const fst = s => t => s;
            const snd = s => t => t;
            const quotInner = n => d => q => { 
                const lastQ = q - 1;
                const nextQ = q + 1;
                const lastR = n + d;
                const nextR = n - d;
                return n + 1 <= 0 ? pair(lastQ)(lastR) : quotInner(nextR)(d)(nextQ);
            }
            const quot = n => d => quotInner(n)(d)(0);
            const result = quot(x => x)(12);
        `))[0] == 5);
        this.assert((await Solver.whereTypableAsOkC(`
            const k = 0;
            const y = (x => x)((y => y) + (z => z));
            const z = 0(0);
        `))[0] == 1);
        this.assert((await Solver.whereTypableAsOkC(`
            0;
            0(0);
            0;
            0(0);
        `))[0] == 1);
        this.assert((await Solver.whereTypableAsOkC(`
            const middleFail = x => {
                const x2 = x + x;
                ((num => num <= 0 ? z => z : y => y)(0)) + 0;
                return 6;
            }
            middleFail(0);
        `))[0] == 1);

        this.assert(Utils.head(await Solver.whereTypableAsOkC(`
            const right1 = 0;
            const right2 = 0;
            const wrong1 = (x => x) - (x => x);
            const wrong2 = (x => x) - (x => x);
        `)) === 2);
    }

    async falsePositivesWeCantShowWrong(){

        this.assert(!(await Solver.isTypableAsOkC(`
            const id = x => x;
            const funcGoesWrongWhenRun = y => id + id;
            const three = 2 + 1;
        `)));
        this.assert(!(await Solver.isTypableAsOkC(`
            const tenOrId = lTOrGTZ => {
                return lTOrGTZ <= 0 ? x => x : 10;
            }
            const eleven = tenOrId(1) + 1;
        `)));

    }

    async showSimpleRights(){
        this.assert(!(await Solver.isTypableAsOkC(`
            const id = x => x;
        `)));
    }
}

const runTests = async () => {
    const tester = new Test();
    await tester.run();
}

runTests();
