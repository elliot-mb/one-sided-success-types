import {Ander} from './ander.js';
import {Utils} from './utils.js';
import {TypedList} from './typedlist.js';
import {ConstraintSet} from './constraint_set.js';

export class Orer extends TypedList{
    static type = 'orer';

    constructor(...ands){
        super(ands);
        this.type = Orer.type;
    }

    isInDNF(){
        return Utils.any([this.isEmpty(), ...this.xs.map(x => x.isInDNF())]); //dependant on whether all the ands just contain constraints
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

    /**
     * converts all the ands inside into constraintsets
     */
    toConstraintSets(){
        if(!this.isInDNF()) throw `toConstraintSets: constraint sets cannot encode disjunction; this disjunction is not in DNF`;
        if(this.isEmpty()) return [new ConstraintSet()];
        return this.getAnds().map(x => new ConstraintSet(x.getOrs())); //the ors returned here should all be constraints 
    }
}