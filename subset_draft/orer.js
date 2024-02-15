import {Ander} from './ander.js';
import {Utils} from './utils.js';
import {TypedList} from './typedlist.js';

export class Orer extends TypedList{
    static type = 'orer';

    constructor(...ands){
        super(ands);
        this.type = Orer.type;
    }

    isEmpty(){
        return Utils.isEmpty(this.xs);
    }

    verifyElem(x){
        Utils.typeIsOrCrash(x, Ander.type);

        return x;
    }

    show(){
        return `OR(${this.showDelegate(' v ')})`;
    }

    /**
     * 
     * @returns the Anders inside 
     */
    getAnds(){
        return this.xs;
    }

    add(and){
        this.verifyElem(and);
        this.xs.push(and);
    }
}