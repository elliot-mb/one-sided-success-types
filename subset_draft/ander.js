import {Utils} from './utils.js';
import {Orer} from './orer.js';
import {Constraint} from './constraint.js';
import {TypedList} from './typedlist.js';

//a set of OrSets understood conjunctively
//or a set of constraints, which would usually be in a ConstraintSet but this is
//our new ConstraintSet
export class Ander extends TypedList{
    static type = 'ander';

    constructor(...orsOrConstraints){ //can be just a single constraint as well!
        super(orsOrConstraints);
        this.type = Ander.type;
    }

    verifyElem(x){
        Utils.typeIsOrCrash(x, Orer.type, Constraint.type);

        return x;
    }

    show(){
        return `AND(${this.showDelegate(' ∧ ')})`;
    }

    /**
     * 
     * @returns the Orers inside
     */
    getOrs(){
        return this.xs;
    }

    add(orOrConstr){
        this.verifyElem(orOrConstr);
        // if(Utils.isType(orOrConstr, Orer.type)){ 
        //     const unitAnds = orOrConstr.getAnds().filter(and => and.size() === 1);
        //     const multiAnds = orOrConstr.getAnds().filter(and => and.size() !== 1);
        //     const spreadOrs = new Orer(unitAnds.reduce((acc, and) => [...acc, ...and.getAnds()]));
        //     this.xs.push(spreadOrs); 
        // }else {
        this.xs.push(orOrConstr);
        //}
    }

    addSpread(orer){

    }

}