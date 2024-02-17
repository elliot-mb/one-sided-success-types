
const printBlocks = () => {
    let a = 0;
    {
        a = 10;
        console.log(a);
    }
    console.log(a);

    // you cant assign blocks to variables unless that variable is a function
    // const a = {
    //     const b = 10;    this does not work
    // };
    // you can create blocks that dont return anything
    const c = () => {
        const b = 10;
    }
    console.log(c()); //'undefined'
    let e = 1;
    const d = () => {
        e++;
    }
    console.log(d());
    

    {
        let f = 10;
    }
    //console.log(f); // but you cannot take variables out of blocks 

    let g = 'g';
    const h = () => { g = 0; }
    console.log(g);
    console.log(h());
    console.log(g); // you can also change the type of the variable

    let i = () => {
        return g; // and you can obviously also have a function evaluate to something
    }

    console.log(i());
}

printBlocks();