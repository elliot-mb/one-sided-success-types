import {Utils} from './utils.js';
import {termShape, getSubterm} from './aw_ast.js';
import {ConstraintSet} from './constraint_set.js';
import {Constraint} from './constraint.js';
import {Orer} from './orer.js';
import {Ander} from './ander.js';

// Γ ⊢ M    (just assumptions and a term)
export class EmptyJudgement{

    static type = 'emptyjudgement';

    constructor(term, assms = {}){
        Utils.termOrCrash(term); 
        this.assms = assms;
        this.term = term;
        this.shape = termShape(this.term);
    }

    variableType(name){
        if(this.assms[name] === undefined) throw `typecheck: term of shape ${this.shape()}, variable '${name}' is free; unbound in function`
        return this.assms[name];
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
        Utils.typeVarOrCrash(type);
        this.assms[name] = type;
    }

    show(){
        return `${JSON.stringify(this.assms)} ⊢ ${this.shape}`;
    }

    //returns a Judgement with its type instantiated, and any immediate constraints in an OrList of AndLists
    constrain(type, constrs = new Orer()){
        //Utils.typeIsOrCrash(ej, EmptyJudgement.type);
        return new Judgement(this.term, type, this.assms, constrs);
    }
}

// Γ ⊢ M : A | C
export class Judgement extends EmptyJudgement{

    static type = 'judgement';

    /**
     * 
     * @param {*} assms is a map from variable names (characters) to type objects
     * @param {*} term 
     * @param {*} type is the type of term
     * @param {*} constrs constraints in and lists in an orlist [optional]
     */
    constructor(term, type, assms = {}, constrs = new Orer()){
        super(term, assms);
        Utils.typeVarOrCrash(type);
        Utils.typeIsOrCrash(constrs, Orer.type);
        this.type = type;
        this.constrs = constrs;
    }

    /**
     * 
     * @returns last Ander of the constrs Orer
     */
    lastAnder(){
        if(Utils.isEmpty(this.constrs.getAnds())) this.constrs.add(new Ander());
        return Utils.last(this.constrs.getAnds());
    }

    show(){
        return `${JSON.stringify(this.assms)} ⊢ ${this.shape} : ${this.type.show()} | ${this.constrs.show()}`;
    }

    //add an atomic constraint (or, constraint)
    addToLast(constr){
        Utils.typeIsOrCrash(constr, Orer.type, Constraint.type);
        //this.constrs.combine(new ConstraintSet([constr]));
        if(constr.type === Constraint.type || !constr.isEmpty()) this.lastAnder().add(constr);
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