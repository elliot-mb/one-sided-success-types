# One-sided typing with complements for proof of incorrectness

One may show that a term 'goes wrong' or diverges by deriving a proof tree 
typing that term as the complement of all values. With this we create a type
system to prove incorrectness; when something 'type checks' it is guarenteed to
go wrong. Yet when it does not it may yet still go wrong. 

# Run scripts

To develop these scripts Bun (https://bun.sh/blog/bun-v1.0.25) was used as a 
local runtime, with npm (https://www.npmjs.com/package/acorn-walk?activeTab=readme)
used where packages were used (inc. AST inspection for javascript).

# Adding terms to the language subset

Currently, terms must be added by adding an entry to `type_grmmr.json`, `type_require.json`
and `type_subtm.json`. Respectively, they:

- Map all AST types to a grammar shape 
- Define rules that forbid terms which the AST type is too general to exclude, that are not in the grammar. These are used to check the grammatical/syntactic correctness of terms.
- Map all AST types to another map from subterms (in the grammar) to field names. These field names belong to the underlying AST type and are used to traverse the tree grammatically. These will be used extensively in the rules.