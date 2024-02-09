// testing https://github.com/acornjs/acorn which includes
// the ast walker https://github.com/acornjs/acorn/tree/master/acorn-walk/
// testing with bun

const acorn = require('acorn');
const walk = require('acorn-walk');

const parse = (prog) => acorn.parse(prog, {ecmaVersion: 2023});
const PROGRAM_T = 'Program';

// writes the tree output as a nicely spaced string
export const pretty = json => `{\r\n${pret(json, '  ')}\r\n}`;
const pret = (json, whitespace = '') => {  // gives an array of lines to the tree_file
    if(json === undefined) throw `pret: json not defined`;

    const isArr = Array.isArray(json); //a flag to stop us printing object key names if we are an array(array indices)
    
    const ks = Object.keys(json);
    if(ks.length === 0) return [];

    const keys_copy = ks.map(k => `${k}`) ;
    const toKey = (i) => isArr ? '' : `"${keys_copy[i]}": `; //we can stop outputting keys if we are an array

    const lines = ks //just the lines that show all the nested objects
        .map(key => json[key]) //the nested objects
        .map((value, i) => Array.isArray(value) //is this value an array
            ? [`${whitespace}${toKey(i)}[\r\n`] + pret(value, whitespace + `  `) + [`\r\n${whitespace}],`]
            : typeof(value) === 'object' && value !== null
                ? [`${whitespace}${toKey(i)}{\r\n`] + pret(value, whitespace + `  `) + [`\r\n${whitespace}},`]
                : `${whitespace}${toKey(i)}${JSON.stringify(value)},`); //stringify handles whether we need quotes
            // : typeof(value) === 'array' 
            //     ? console.log('array')
            
    const blockString = lines.reduce((acc, x) => `${acc}\r\n${x}`).slice(0, -1); //in a block of terms there is a single comma on the end, remove this 

    return blockString;
};

//a map from AST types to maps from subterm names (M, N, P, m, n) to their 
//fields in the AST object
// the 'fields' are arrays string[] where each property must be used in order
// to retrieve the property (most are just one long (singleton arrays))
const typeToSubterms = require('./AST_subtm.json');

//a map from AST types to grammar shapes 
export const typeToGrammar = require('./AST_grmmr.json');

//a map from AST types to maps from specific fields to restrictions they must obey
//in an effort to express whats permitted in the subset of the language
//a list of restrictions is disjunctive or conjunctive, based on the symbol 'ANY' or 'ALL' resp.
//in the 'satisfies' field of the object that holds the restriction list 
const typeToProperties = require('./AST_require.json');

//turns the root node of the term's type to the grammar shape
// as a string
export const termShape = (term) => {
    if(term.type === undefined) throw `getSubterm: term has no 'type' field`;
    
    return typeToGrammar[term.type];
    
}

//gets a subterm based on a term and the name in the grammar.
//throws an error if a name is used thats not in the grammar for that term type.
//this function should be used to traverse the tree in a way that corresponds
//to the shapes of terms.
export const getSubterm = (term, subtermName) => {
    if(subtermName === undefined) throw `getSubterm: subtermName was not given`;
    if(term.type === undefined) throw `getSubterm: term has no 'type' field`;
    
    const nameToSubterm = typeToSubterms[term.type]; //shape to subterms
    if(nameToSubterm === undefined) throw `getSubterm: term of 'type' '${term.type}' does not ` + 
    `exist in the grammar`
    if(nameToSubterm[subtermName] === undefined) throw `getSubterm: term of shape '${typeToGrammar[term.type]}' ` + 
    `has no subterm called '${subtermName}'`;
    //we know the AST term to subterm map, we perform the access steps in the 
    //map in order to return the sub-AST-object/subterm object
    const steps = nameToSubterm[subtermName];
    let tempField = term; // reassigned
    steps.forEach((step) => tempField = tempField[step]); 
    
    if(tempField === undefined) throw `getSubterm: steps [${steps}] on this term ` +
    `of shape '${typeToGrammar[term.type]}' for '${subtermName}' did not succeed due to undefined field`;
    return tempField;
}

const ruleNameArg = rule => {
    const nameAndArg = rule[func];
    const names = Object.keys(nameAndArg);
    if(names.length !== 1) throw `checkRule: function specifier has the wrong number of fields`;
    const name = names[0];
    const arg = nameAndArg[name]; //gets the function argument from the pair
    return {"name": name, "arg": arg};
}

//rule is the current level we are in the rule chain (element of the rules array)
//value is initially the value of the field the rules are applied to, but it changes
//depending on whether any property accesses are made (its then set to that property value)
//fieldname is just for informative errors (says what field we're checking)
const checkRule = (rule, objOrValue, fieldname) => {
    //crashes if rule is not satisfied
    // specification: "F" as a key => value is an object of <function name> : <operand> 
    //                "P" as a key => value is an object of <property name> : <requirement>
    //                <requirement> is an object with either "F" or "P" as a single key
    const func = 'F';
    const prop = 'P';
    const funcs = { //all functions referred to in the type_require.json
        'equals': v => x => v === x, //take the value and the argument of the rule
        'typeof': v => x => typeof(v) === x
    };

    if(rule === undefined) throw `checkRule: rule not defined`;
    const ruleTypes = Object.keys(rule);
    if(ruleTypes.length !== 1) throw `checkRule: rule has the wrong number of fields`;
    const ruleType = ruleTypes[0];
    if(ruleType === func){ //no more recursion
        const funcNameArg = rule[func];
        const funcNames = Object.keys(funcNameArg);
        if(funcNames.length !== 1) throw `checkRule: function specifier has the wrong number of fields`;
        const funcName = funcNames[0];
        const useFunc = funcs[funcName]; //function to use the value and arg with
        const funcArg = funcNameArg[funcName]; //gets the function argument from the pair
        const isOk = useFunc(objOrValue)(funcArg);
        if(!isOk) throw `checkRule: property violates '${funcName}' check on '${objOrValue}' and '${funcArg}', for '${fieldname}'`;
        return;
    }
    if(ruleType === prop){
        const propNameRule = rule[prop];
        const propNames = Object.keys(propNameRule);
        if(propNames.length !== 1) throw `checkRule: property specifier has the wrong number of fields`;
        const propName = propNames[0];
        const newRule = propNameRule[propName];
        const newObjOrValue = objOrValue[propName];
        checkRule(newRule, newObjOrValue, propName);
        return;
    }
    throw `checkRule: unexpected token '${ruleType}' which is not a recongised rule type`
}

export const checkTerm = term => {
    //                rules are built around property names, like
    /**
     * {
     *      <ast_type> : {
     *          <field_rules_are_applied_to>: {
     *              "satisfies": "ANY" | "ALL", 
     *              "rules": <requirement>[]
     *          },
     *          <field_rules_are_applied_to>: {...}
     *      }
     * ...
     * }
     */

    //tokens for the specification
    const stfy = 'satisfies';
    const ruls = 'rules';
    const sAny = 'ANY';
    const sAll = 'ALL';
    const rAny = x => y => x || y;
    const rAll = x => y => x && y;

    if(term === undefined) throw `checkTerm: term not defined`;
    if(term.type === undefined) throw `checkTerm: term.type not defined`;
    const checkFields = typeToProperties[term.type]; 
    if(checkFields === undefined) throw `checkTerm: there is no term of type '${term.type}' in the grammar`
    Object.keys(checkFields).map(field => { //field under this type of term in the AST
        const ruleset = checkFields[field];
        if(ruleset[stfy] === undefined) throw `checkTerm: ruleset is missing the 'satisfies' property`;
        const reducer = ruleset[stfy] === sAny ? rAny : rAll;   
        if(ruleset[ruls].length === 0) throw `checkTerm: rulesets must have at least one rule`;
        const fails = [];
        const isOk = ruleset[ruls]
            .map((rule, i) => {
                try{
                    checkRule(rule, term[field], field);
                }catch(err){
                    //console.log(err);
                    fails.push(i);
                    return false;
                }
                return true; //we need to not crash out in teh case that rAny is selected
            })
            .reduce((acc, x) => reducer(acc)(x));
        if(!isOk) throw `checkTerm: '${ruleset[stfy]}' rule(s) in ruleset not met: rule #s [${fails}]`;

    });
}

//verifies that the term uses just the expected shapes of subterms all the way down
export const checkGrammar = term => {
    if(term === undefined) throw `checkGrammar: term is not defined`
    //base case where the term evalutes to raw strings or numbers
    if(typeof(term) !== 'object') return;

    if(term.type === undefined) throw `checkGrammar: term has no 'type' field`;
    if(typeToSubterms[term.type] === undefined) throw `checkGrammar: there is no term of type '${term.type}' in the grammar`
    const subtermNames = Object.keys(typeToSubterms[term.type]);
    let subterms;
    try{
        checkTerm(term); //will crash 
        subterms = subtermNames.map(subtermName => getSubterm(term, subtermName));
        subterms.map(subterm => checkGrammar(subterm));
    }catch(err){
        throw `checkGrammar: term shape '${typeToGrammar[term.type]}' failed since ${err}`;
    }
    // here, we know the term is written just using the specification in ./type_subtm.json
}

//just first expression argument is there while we only have single expressions
export const toASTTree = (program, justFirstExpression = true, enforceGrammar = true) => {
    //console.log(`${program} to AST Tree`);
    let tree = {};
    walk.full(parse(program), (node) => {
        if(node.type === PROGRAM_T){
            tree = node;
        }
    });

    if(justFirstExpression) tree = tree['body'][0]['expression'];
    if(enforceGrammar) checkGrammar(tree);

    return tree;
}

export const showsTree = async (name, program) => {
    const f = `./${name}.json`;
    await Bun.write(f, pretty(toASTTree(program, true, false)));
}