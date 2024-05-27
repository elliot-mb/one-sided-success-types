const addOrId = selector => {
    const add = x => y => x + y;
    const id = x => x;
    return selector <= 0 ? add : id;
}
const addAddAddId = addOrId(1)(addOrId(0)(addOrId(0)(3)(2))(addOrId(0)(3)(4)));
const idIdIdAdd   = addOrId(1)(addOrId(1)(addOrId(1)(addOrId(0)(2)(3))));
const towardsZ = x => x <= 0 ? x + 1 : x - 1;
const use = towardsZ(x => 0);
const addOrIdAddOrId = addOrId(towardsZ);

// console.log(addAddAddId);
// console.log(idIdIdAdd);