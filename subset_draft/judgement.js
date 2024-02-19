import {Utils} from './utils.js';
import {termShape, getSubterm} from './aw_ast.js';
import {ConstraintSet} from './constraint_set.js';
import {Constraint} from './constraint.js';
import {Orer} from './orer.js';
import {Ander} from './ander.js';
import {Assms} from './assms.js';

// Γ ⊢ M    (just assumptions and a term)
export class EmptyJudgement{

    static type = 'emptyjudgement';

    constructor(term, assms = new Assms()){
        Utils.termOrCrash(term); 
        Utils.typeIsOrCrash(assms, Assms.type);
        this.assms = assms;
        this.term = term;
        this.shape = termShape(this.term);
        this.type = EmptyJudgement.type;
    }

    variableType(name){
        if(!this.assms.isIn(name)) throw Utils.makeErr(`typecheck: term of shape ${this.shape()}, variable '${name}' is free; unbound in function`);
        return this.assms.get(name);
    }

    //returns a new EmptyJudgement with the same assms but on the subterm
    getSubterm(shape){
        return getSubterm(this.term, shape);
    }   

    //tries to return the subterm as an empty judgement but may fail if e.g. we are getting a var name 
    asSubterm(shape){
        return new EmptyJudgement(this.getSubterm(shape), this.assms);
    }

    //add a new assm to assms 
    addAssm(name, type){
        this.assms.add(name, type);
    }

    show(){
        return `${this.assms.show()} ⊢ ${this.shape}`;
    }

    //returns a Judgement with its type instantiated, and any immediate constraints in an OrList of AndLists
    constrain(termType, constrs = new Orer()){
        //Utils.typeIsOrCrash(ej, EmptyJudgement.type);
        return new Judgement(this.term, termType, this.assms, constrs);
    }
}

// Γ ⊢ M : A | C
export class Judgement extends EmptyJudgement{

    static type = 'judgement';

    /**
     * 
     * @param {*} assms is a map from variable names (characters) to type objects
     * @param {*} term 
     * @param {*} termType is the type of term
     * @param {*} constrs constraints in and lists in an orlist [optional]
     */
    constructor(term, termType, assms = new Assms(), constrs = new Orer()){
        super(term, assms);
        Utils.typeVarOrCrash(termType);
        Utils.typeIsOrCrash(constrs, Orer.type);
        this.termType = termType;
        this.constrs = constrs;
        this.type = Judgement.type;
    }

    /**
     * 
     * @returns last Ander of the constrs Orer
     */
    lastAnder(){
        if(Utils.isEmpty(this.constrs.getAnds())) this.addAnder();
        return Utils.last(this.constrs.getAnds());
    }

    /**
     * adds a new group of constraints corresponding to another rule 
     */
    addAnder(){
        this.constrs.add(new Ander());
    }

    show(){
        return `${this.assms.show()} ⊢ ${this.shape} : ${this.termType.show()} | ${this.constrs.show()}`;
    }

    /**
     * add an atomic constraint (or, constraint) to the last ander in constrs
     **/
    addToLast(constr){
        Utils.typeIsOrCrash(constr, Orer.type, Constraint.type);
        //this.constrs.combine(new ConstraintSet([constr]));
        if(constr.type === Constraint.type || !constr.isEmpty()) this.lastAnder().add(constr);
    }

    /**
     * remove repeated constraints in all anders (does not remove repeated orers, as that should not be the case for any rules)
     * called at the end of each rule application, including the root
     * 
     * so something like this 
     * ⊢ M o N : XB | OR(AND(Num = Num ∧ Num = Num ∧ XB = Num))
     *   2 - 1 : Num   
     * is reduced to this
     * ⊢ M o N : XB | OR(AND(Num = Num ∧ XB = Num)) --notice the dropping of repeated constraint 
     *   2 - 1 : Num
     * 
     */
    removeRepeats(){
        if(this.constrs.getAnds().length > 0){
            this.constrs = new Orer(...this.constrs.getAnds().map(ander => {
                let constrs = ander.getConstraints();
                constrs = Utils.removeRepeats(constrs);
                return new Ander(...ander.getNotConstraints(), ...constrs);
            }));
        }
    }

    // /**
    //  * 
    //  * @param {*} constraint set (ander full of orers or constraints)
    //  */
    // union(constrs){
    //     const last = this.lastAnder();
    //     Utils.typeIsOrCrash(constrs, Ander.type);
    //     constrs.getOrs().map(x => last.add(x)); //getOrs returns all the Orers which we can add to the last Ander
    // }

}