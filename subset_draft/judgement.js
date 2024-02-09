import {Utils} from './utils';

export class Judgement{

    static type = 'judgement';

    constructor(term, assms){
        Utils.termOrCrash(term); 
        
    }

}