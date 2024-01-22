
const CRASH_ID = 6;

switch(CRASH_ID){
    case 0:
        
        const list = 0;
        list.map(x => x); //outright crashes with an error

        break;
    case 1:
        {
            const x = 'a';
            const y = 0;
            const z = x - y;
            console.log(z); //c is NaN which is not a number which is not a value (goes wrong)
        }
        break;

    case 2:
        {
            const x = () => 0;
            const y = 1;
            const z = x + y;
            console.log(z); // gives a string, undefined behaviour (goes wrong)
        }
        break;
    case 3:
        {
            const x = null;
            const y = 1;
            x(y); // crash: null is not a funtion (goes wrong)
        }
        break;
    case 4: 
        {
            console.log([][1]); //returns undefined, undefined behaviour (goes wrong)
        }
        break;
    case 5:
        {
            console.log([][undefined]); //returns undefined, both this and the last are because array syntax is also json syntax (goes wrong)
        }
        break;
    case 6:
        {
            const f = (f) => f(f); 
            f(f); //diverges
        }
        break;
    default:
        throw `crash id ${CRASH_ID} does not select a program.`;
}// walk.simple(parse('let x = 10; let y = 100;'), {
//     Literal(node){
//         console.log(`Found a literal: ${node.value}`);
//     }
// });