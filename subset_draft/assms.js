import {Utils} from "./utils.js";
import {TypedList} from "./typedlist.js";

export class Assms{
    
    constructor(typings = {}){
        this.typings = typings; //lookup table on the variable identifier
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