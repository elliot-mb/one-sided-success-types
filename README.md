# One-sided typing with complements for proof of incorrectness

One may show that a term 'goes wrong' or diverges by deriving a proof tree 
typing that term as the complement of all values. With this we create a type
system to prove incorrectness; when something 'type checks' it is guarenteed to
go wrong. Yet when it does not it may yet still go wrong. 

# Run CompaSS

## Requirements
- NodeJS v16.14.2
- Python 3.10.12

## Ill-type a single program:
We use ``$ <command>`` to display a command in the terminal.\
We use ``./path`` to reference a path relative to the root of the git repository.

### Instructions
- Change working directory to ``./demo`` (``$ cd demo #from project root``).
- ``$ vim proj.js`` allows you to write your JSS program (consult the grammar for valid syntax).
- ``$ chmod 700 ./demo && ./demo && cat out.txt``  if you are in a *zsh* terminal. \
    If you are not, run ``$ node demo.js`` instead, or ``$ node demo.js > out.txt && cat out.txt`` to save your input.


# Run scripts

Initially Bun was used to run these scripts, but issues with using Z3 bindings for JavaScript ([npm package](https://www.npmjs.com/package/z3-solver)) meant that for now I have to switch to Node to use it, due to an (as of 20/02/24) [unsolved bug with file path length](https://github.com/denoland/deno/issues/21695). This post is for another new local JavaScript runtime Deno, but a similar issue arises with Bun. 

~~To develop these scripts Bun (https://bun.sh/blog/bun-v1.0.25) was used as a 
local runtime, with npm (https://www.npmjs.com/package/acorn-walk?activeTab=readme)
used where packages were used (inc. AST inspection for javascript).~~

# Adding terms to the language subset

Currently, terms must be added by adding an entry to `AST_grmmr.json`, `AST_require.json`
and `AST_subtm.json`. NB `AST_subtm.json` applies to just the modified AST where we recurse blocks for type checking. Respectively, they:

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

# Type reconstructor 

Examples:
```
x => y => (0 + 1 - x(0) <= 0 ? x : y) : (Num -> Num) -> (Num -> Num) -> Num -> Num
x => x : A -> A
2 - 1 : Num
f => x => f(f(x)) : (A -> A) -> A -> A
f => g => x => f(g(x)) : (A -> B) -> (C -> A) -> C -> B
x => 0 : A -> Num
x => x(y => y(0))(f => x => f(f(x))) : (((Num -> A) -> A) -> ((B -> B) -> B -> B) -> C) -> C
```

# Development 

A summary of the process of developing the success type system with complements
for JSS (see overleaf).

# Grammar 

### 10/02/24

```
values
V, W ::= x 
         n 
         x => M 
         @@null@@

terms @@those in @s are not yet implemented@@
M, N, P ::= x 
            n 
            x => M 
            null
            M + N 
            M - N
            M(N)
            M <= 0 ? N : P 
            @@const f = () => { M; return N }; P@@
            @@const x = M; N@@

A, B ::= Num 
         A -> B
         @@A^c@@
         @@Ok@@
         @@object@@ --NB this is the type of null
```
