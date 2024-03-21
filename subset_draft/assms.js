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
        this.typings[name] = type;
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

    deepCopy(){
        const newAssms = new Assms();
        Object.keys(this.getTypings()).map(x => newAssms.add(x, this.get(x)));
        return newAssms;
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