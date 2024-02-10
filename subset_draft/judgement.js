import {Utils} from './utils.js';
import {termShape, getSubterm} from './aw_ast.js';
import {ConstraintSet} from './constraint_set.js';
import {Constraint} from './constraint.js';

// Γ ⊢ M    (just assumptions and a term)
export class EmptyJudgement{

    static type = 'emptyjudgement';

    constructor(term, assms = {}){
        Utils.termOrCrash(term); 
        this.assms = assms;
        this.term = term;
    }

    shape(){
        return termShape(this.term.type);
    }

    variableType(name){
        if(this.assms[name] === undefined) throw `typecheck: term of shape ${this.shape()}, variable '${name}' is free; unbound in function`
        return this.assms[name];
    }

    //returns a new EmptyJudgement with the same assms but on the subterm
    getSubterm(shape){
        return new EmptyJudgement(this.assms, getSubterm(this.term, shape));
    }   

    //add a new assm to assms 
    addAssm(name, type){
        Utils.typeVarOrCrash(type);
        this.assms[name] = type;
    }

    show(){
        return `${JSON.stringify(assms)} ⊢ ${shape()}`;
    }

    //returns a Judgement 
    upgrade(ej, type, constrs = new ConstraintSet()){
        Utils.typeIsOrCrash(ej, EmptyJudgement.type);
        return new Judgement(this.assms, this.term, type, constrs);
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
     * @param {*} constrs constraint set [optional]
     */
    constructor(term, type, assms = {}, constrs = new ConstraintSet()){
        Utils.typeVarOrCrash(type);
        Utils.typeIsOrCrash(constrs, ConstraintSet.type);
        super(term, assms);
        this.type = type;
        this.constrs = constrs;
    }

    show(){
        return `${JSON.stringify(assms)} ⊢ ${shape()} : ${this.type.show()} | ${this.constrs.show()}`;
    }

    //add a single constraint to the set
    unionSingle(constr){
        Utils.typeIsOrCrash(constr, Constraint.type);
        this.constrs.combine(new ConstraintSet([constr]));
    }

    //union constraint sets
    union(constrSet){
        Utils.typeIsOrCrash(constrSet, ConstraintSet.type);
        this.constrs.combine(constrSet);
    }

}