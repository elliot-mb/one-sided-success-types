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
- Map all AST types to another map from subterms (in the grammar) to field names. These field names belong to the underlying AST type and are used to traverse the tree grammatically. These will be used extensively in the rules for success type inference.

The syntax of the `type_require.json` file, hereby *the rulesets*, is the most contrived.
It is mentioned in comments, but concretely, a ruleset is defined on a term, which belongs to an AST node. This makes sense as the rules are specifically for ruling out certain AST nodes that are not part of the grammar. 

A ruleset is a logical operator (`"ANY"` for OR, `"ALL"` for AND) and, sensibly, a collection of rules. These rules are combined with the logical operator to discern whether a term violates the ruleset. 

Individual rules have the form R, S ::= `{"P": {p: R}}` | `{"F": {f: R}}` \
where `p` and `f` are special strings. `p` is the name of any *property* on the current object, where rules of the former shape traverse deeper into the field being tested.
`f` is the name of a *function* which is used to test the value, type etc. of a base (non-object) value of the current field being tested. With this the structure and validity of the fields of an object can be probed with fine detail. 

To decide what properties to check and rule out, the AST for any term can be written with the `pretty` function to a json (e.g. `tree_file.json`) and inspected by hand.