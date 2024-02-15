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

    //try to reduce nesting by moivng 'one thing' into this xs when pairs are nested like: This(OR(AND(one thing)))
    // we pass in something of our own
    // we either get a constraint, a multi-ary or, or a set of ors dredged up from the depths of a singleton and
    collapse(orOrConstr){
        if(Utils.isType(orOrConstr, Constraint.type)) return orOrConstr; //it cannot be collapsed, because it is already in an ander
        const or = orOrConstr; // we know its an or now
        const ands = or.getAnds();
        if(ands.length === 0) return null;
        if(ands.length > 1) return or; //not unit size
        const and = ands[0] //we know its just one ander in this or
        const ors = and.getOrs();
        return ors; 
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
        const arrayer = (maybeArray) => maybeArray.length !== undefined ? maybeArray : [maybeArray];
        this.xs = this.xs
            .map(x => this.collapse(x))
            .filter(x => x !== null)
            .reduce((acc, maybeArray) => [...acc, ...(arrayer(maybeArray))], []);
        console.log(this.xs);
        //}
    }

    addSpread(orer){

    }

}