import {Utils} from './utils.js';
import { GenT, NumT, ArrowT, OkT, CompT } from './typevar.js';

export class Test {

    static run(){
        console.log('tests:')
        Test.showAndRun(Test.testTypeEquality);
    }

    //assert true
    static assert(b1){
        if(!b1) throw Utils.makeErr(`assert: failed`);
    }

    static showAndRun(method){
        method();
        console.log(method.name);
    }

    static testTypeEquality(){
        Test.assert(new GenT('A').equals(new GenT('A')));
        Test.assert(new GenT('A').equals(new GenT('B')) === false);
        Test.assert(new CompT(new GenT('A')).equals(new CompT(new GenT('A'))));
        Test.assert(new CompT(new OkT()).equals(new CompT(new OkT())));
        Test.assert(new CompT(new ArrowT(new GenT('A'), new GenT('B')))
            .equals(new CompT(new ArrowT(new GenT('A'), new GenT('B')))));
        Test.assert(new ArrowT(new CompT(new GenT('A')), new GenT('B'))
            .equals(new ArrowT(new CompT(new GenT('A')), new CompT(new GenT('B')))) === false);
        //disjointedness
        Test.assert(new NumT().equals(new ArrowT(new GenT('D'), new GenT('E'))) === false);
        Test.assert(new ArrowT(new GenT('D'), new GenT('E')).equals(new NumT()) === false);
        Test.assert(new GenT('A').equals(new CompT(new GenT('B'))) === false);
        Test.assert(new CompT(new GenT('B')).equals(new GenT('A')) === false);
    }

}

Test.run();