
const CRASH_ID = 2;

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
            console.log(z); //c is NaN which is not a number which is not a value (so it has gone wrong)
        }
        break;

    case 2:
        {
            const x = () => 0;
            const y = 1;
            const z = x + y;
            console.log(z); // gives a string, undefined behaviour 
        }
        break;
    default:
        throw `crash id ${CRASH_ID} does not select a program.`;
}// walk.simple(parse('let x = 10; let y = 100;'), {
//     Literal(node){
//         console.log(`Found a literal: ${node.value}`);
//     }
// });