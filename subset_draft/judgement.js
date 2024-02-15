import {Utils} from './utils.js';
import {termShape, getSubterm} from './aw_ast.js';
import {ConstraintSet} from './constraint_set.js';
import {Constraint} from './constraint.js';
import {OrList} from './orlist.js';
import {AndList} from './andlist.js';

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
    constrain(type, constrs = new OrList()){
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
    constructor(term, type, assms = {}, constrs = new OrList()){
        super(term, assms);
        Utils.typeVarOrCrash(type);
        Utils.typeIsOrCrash(constrs, OrList.type);
        this.type = type;
        this.constrs = constrs;
        if(Utils.isEmpty(this.constrs.getOrs())) this.constrs.add(new AndList());
    }

    //returns the last andset in the orset: the last elem of constrs
    lastAndList(){
        return Utils.last(this.constrs.getOrs());
    }

    show(){
        return `${JSON.stringify(this.assms)} ⊢ ${this.shape} : ${this.type.show()} | ${this.constrs.show()}`;
    }

    //add a single constraint to the last andset in the orset
    unionSingle(constr){
        Utils.typeIsOrCrash(constr, Constraint.type);
        //this.constrs.combine(new ConstraintSet([constr]));
        
        this.lastAndList().add(constr);
    }

    /**
     * 
     * @param {*} constraint set (a single andlist full of orlists or constraints)
     */
    union(constrs){
        Utils.typeIsOrCrash(constrs, AndList.type);
        constrs.getAnds().map(x => this.lastAndList().add(x));
    }

}