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

    hasOrersInside(){
        //if any are not constraint types 
        return Utils.any(this.xs.map(x => !Utils.isType(x, Constraint.type))); //we dont have to check any deeper because they can only be Orers otherwise 
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
        const and = ands[0] //we know its just one ander in this orer, its a unit so we can bring it up through to 'this' ander
        const ors = and.getOrs();
        return ors; 
    }

    add(orOrConstr){
        this.verifyElem(orOrConstr);
        this.xs.push(orOrConstr);
        const arrayer = (maybeArray) => maybeArray.length !== undefined ? maybeArray : [maybeArray];
        this.xs = this.xs //for all xs
            .map(x => this.collapse(x))
            .filter(x => x !== null)
            .reduce((acc, maybeArray) => [...acc, ...(arrayer(maybeArray))], []);
    }

    getConstrains(){
        return this.xs.filter(x => x.type === Constraint.type);
    }
}