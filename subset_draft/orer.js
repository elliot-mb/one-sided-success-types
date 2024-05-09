import {Ander} from './ander.js';
import {Utils} from './utils.js';
import {TypedList} from './typedlist.js';
import {ConstraintSet} from './constraint_set.js';
import {Constraint } from './constraint.js';


export class Orer extends TypedList{
    static type = 'orer';

    constructor(...ands){
        super(ands);
        this.type = Orer.type;
    }

    isInDNF(){
        //they all dont have orers inside which means they just are just constraints anded together
        return this.isEmpty() || Utils.all(this.xs.map(x => !x.hasOrersInside())); //dependant on whether all the ands just contain constraints
    }

    isEmpty(){
        return Utils.isEmpty(this.xs);
    }

    verifyElem(x){
        Utils.typeIsOrCrash(x, Ander.type);

        return x;
    }

    show(){
        return `[${this.showDelegate(' v ')}]`;
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
        if(!this.isInDNF()) throw Utils.makeErr(`toConstraintSets: constraint sets cannot encode disjunction; this disjunction is not in DNF`);
        if(this.isEmpty()) return [new ConstraintSet()];
        return this.getAnds().map(x => new ConstraintSet(x.getOrs())); //the ors returned here should all be constraints 
    }

    /**
     * convert take out just the unit anders from the top level rule (for final constraint resolution/unification)
     * these are stored in a single constraintset to be observed disjunctively 
     */
    toConstraintSet(){
        const JUST_ONE = 1;
        const constrs = this.getAnds()
            //must be single constraints
            .filter(x => x.getOrs().length === JUST_ONE && x.getOrs()[0].type === Constraint.type)
            //get the constraint out
            .map(x => x.getOrs()[0]);
        return new ConstraintSet(constrs);
    }
}