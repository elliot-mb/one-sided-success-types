import {GenT} from './typevar.js';

export class Utils{

    static firstCharCode = 'A'.charCodeAt(0);
    static lastCharCode = 'Z'.charCodeAt(0);
    static rollsover = (char) => char.charCodeAt(0) + 1 > Utils.lastCharCode;
    static incrementLetter = (char) => {
        const code = char.charCodeAt(0);
        return Utils.rollsover(char) ? 'A' : String.fromCharCode(code + 1);
    }

    //returns either a string or '#' signifying it has rolled over (we obviously know what it will be?)
    static nextFreeTypeName = (typeName) => {
        if(typeof(typeName) !== 'string') throw 'nextFreeTypeName: typeName must be a string';
        let newName = `${typeName}`;
        let carry = false;
        for(let i = newName.length - 1; i >= 0; i--){ 
            const char = newName[i];
            if(i === newName.length - 1 || carry){
                newName = `${newName.slice(0, i)}${Utils.incrementLetter(char)}${newName.slice(i + 1)}`;
                carry = Utils.rollsover(char);
            }else{
                carry = false;
            }
        }
        if(carry){
            newName = `A${newName}`;
        }
        return newName;
    }

    static typeVarsOrCrash = (A, B) => {
        try{
            if(A.typeof() !== GenT.type) throw 'typeVarsOrCrash: A must be a \'typevar\'';
            if(B.typeof() !== GenT.type) throw 'typeVarsOrCrash: B must be a \'typevar\'';
        }catch(err){
            console.log(`typeVarsOrCrash: object dump A`);
            console.log(A);
            console.log(`typeVarsOrCrash: object dump B`);
            console.log(B);
            throw 'typeVarsOrCrash: A or B was not a typevar: ' + err
        }
    }
    static typeVarOrCrash = (A) => {
        if(A.typeof() !== GenT.type) throw 'typeVarOrCrash(): A must be a \'typevar\'';
    }

    //makes type variables more readable (e.g. (T2 -> T2) -> T2 -> T2 becomes (A -> A) -> A -> A)
    static downgradeTypes = (T) => {
        Utils.typeVarOrCrash(T);
        const allUniqueTypes = T.freeIn();
        let freshT = String.fromCharCode(Utils.firstCharCode);
        for(let i = 0; i < allUniqueTypes.length; i++){
            T.rename(allUniqueTypes[i], freshT);
            freshT = Utils.nextFreeTypeName(freshT);
        }
    }
}
