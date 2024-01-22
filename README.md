# One-sided typing with complements for proof of incorrectness

One may show that a term 'goes wrong' or diverges by deriving a proof tree 
typing that term as the complement of all values. With this we create a type
system to prove incorrectness; when something 'type checks' it is guarenteed to
go wrong. Yet when it does not it may yet still go wrong. 

# Run scripts

To develop these scripts Bun (https://bun.sh/blog/bun-v1.0.25) was used as a 
local runtime, with npm (https://www.npmjs.com/package/acorn-walk?activeTab=readme)
used where packages were used (inc. AST inspection for javascript).