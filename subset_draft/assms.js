import {Utils} from "./utils.js";
import {TypedList} from "./typedlist.js";
import {Constraint} from "./constraint.js";
import {GenT} from "./typevar.js";

export class Assms{
    static type = 'assms';

    constructor(typings = {}){
        this.typings = typings; //lookup table on the variable identifier
        this.type = Assms.type;
    }

    isIn(name){
        return this.typings[name] !== undefined;
    }

    get(name){
        return this.typings[name];
    }

    add(name, type){
        Utils.typeVarOrCrash(type);
        if(this.typings[name] !== undefined) throw Utils.makeErr(`assms.add: ${name} not free in assms`);
        this.typings[name] = type;
    }



    addAll(assms){
        Object.keys(assms.getTypings()).map(varName => {
            //console.log(varName, assms[varName]);
            this.add(varName, assms.get(varName));
        });
    }

    show(){
        const listOfMe = new TypedList(Object.keys(this.typings).map(k => `${k}: ${this.typings[k].show()}`));
        return listOfMe.show();
    }

    count(){
        return Object.keys(this.typings).length;
    }

    //return a list of typings as constraints
    getTypings(){
        return this.typings; // return Object.keys(this.typings).map(k => new Constraint(new GenT(k), this.typings[k])); 
    }

    getLocalTypings(){
        //create a type environment which just has type variables that arent top
        //level types 
        const noTopLevelTypings = {};
        Object.keys(this.typings).map(k => {
            const ty = this.typings[k];
            if(!ty.topLevel()){ 
                noTopLevelTypings[k] = ty;
            }
        });
        return noTopLevelTypings;
    }

    deepCopy(){
        const newAssms = new Assms();
        Object.keys(this.getTypings()).map(x => newAssms.add(x, this.get(x)));
        return newAssms;
    }

    /**
     * we mutate these assumptions by removing those which do not appear in 
     * otherDom.
     * @param {*} otherDom string[] the domain which will be intersected with this one
     */
    intersectionDom(otherDom){
        const newTypings = {}; //will be set to this typings
        otherDom.map(othDmKey => {
            if(this.isIn(othDmKey)){ //just keep the common ones (do not add any)
                newTypings[othDmKey] = this.get(othDmKey);
            }
        });
        this.typings = newTypings;
    }

}


// export class Assms{
//     static type = 'assms';

//     constructor(typings = {}){
//         this.typings = typings;
//     }

//     add(name, type){
//         Utils.typeVarOrCrash(type);
//         this.typings[name] = type;
//     }
// }