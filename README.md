# University Thesis Project 2023/24, University of Bristol for BSc Computer Science with First Class Honors
I achieved **89** marks in this unit, with such comments from my markers (both experts at the forefront of their areas of research, with my supervisor attending POPL'23 to present [the work on which this paper was based](https://arxiv.org/abs/2307.06928)):
- ***"This would be a very impressive project even for a masters level student, and so it is all the more so for a third year."***
- *"A huge amount of work has gone into this project, and all of it has been done to an exemplary standard."*
- *"The writing is consistently of a very high standard, and in particular, the technical writing is clear and precise and more consistent with what I would expect from a graduate student."*
- *"The type system design is excellent and the rules are exactly what I would expect to see in a research paper on this topic."*
- *"There are numerous excellent examples to illustrate the work, which makes the technical material more accessible."*
- *"A very well designed implementation allows for easy experimentation and feedback and has allowed the student to get some data on the scalability of constraint solving."*
- *"The evaluation presents, by careful choice of examples, a solid appraisal of the main strengths and weaknesses of the work.  A number of practical advantages and distadvantages of the type system are noted and some limiting factors of the subset of Javascript that it targets."*
- *"A substantial and highly non-trivial proof shows the constraint rules to be sound and complete with respect to the rules of the type system."*

Many such comments are made about the write-up, the PDF of which is available in this repository. It will also be made available on my website. 

# Read the [report](https://github.com/elliot-mb/one-sided-success-types/blob/main/Report.pdf)

![CompaSS logo](compass.png "CompaSS")

# CompaSS, an Automated Proof of Incorrectness System For JSS

One may show that a term 'goes wrong' or diverges by deriving a proof tree 
typing that term as the complement of all values, supplied success semantics. With this we create a type
system to prove incorrectness; when something 'type checks' it is guarenteed to
go wrong, diverge or use undesired behaviour. Yet when it does not we make no guarantees. 

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

## Run test suite
The test suite contains unit tests and different kinds of ill-typing tests for CompaSS to complete, and takes around thirty seconds to a minute to run.

### Instructions
- Change working directory to ``./subset_draft`` (``$cd compass #from project root``).
- ``$ node test`` with give general print statements and a report at the end indicating successes and failures.
<!-- 
# Run scripts -->

<!-- Initially Bun was used to run these scripts, but issues with using Z3 bindings for JavaScript ([npm package](https://www.npmjs.com/package/z3-solver)) meant that for now I have to switch to Node to use it, due to an (as of 20/02/24) [unsolved bug with file path length](https://github.com/denoland/deno/issues/21695). This post is for another new local JavaScript runtime Deno, but a similar issue arises with Bun.  -->

<!-- ~~To develop these scripts Bun (https://bun.sh/blog/bun-v1.0.25) was used as a 
local runtime, with npm (https://www.npmjs.com/package/acorn-walk?activeTab=readme)
used where packages were used (inc. AST inspection for javascript).~~ -->

# Adding terms to the language subset

Currently, terms must be added by adding an entry to `AST_grmmr.json`, `AST_require.json`
and `AST_subtm.json`. NB `AST_subtm.json` applies to just the modified AST where we recurse blocks for type checking. Respectively, they:

- Map all AST types to a grammar shape 
- Define rules that forbid terms which the AST type is too general to exclude, that are not in the grammar. These are used to check the grammatical/syntactic correctness of terms.
- Map all AST types to another map from subterms (in the grammar) to field names. These field names belong to the underlying AST type and are used to traverse the tree grammatically. These will be used extensively in the rules for success type inference.

The syntax of the `type_require.json` file, hereby *the rulesets*, is the most contrived.
It is mentioned in comments, but concretely, a ruleset is defined on a term, which belongs to an AST node. This makes sense as the rules are specifically for ruling out certain AST nodes that are not part of the grammar. 

A ruleset is a logical operator (`"ANY"` for OR, `"ALL"` for AND, `"NONE"` for NOT) and, sensibly, a collection of rules. These rules are combined with the logical operator to discern whether a term violates the ruleset. 

Individual rules have the form R, S ::= `{"P": {p: R}}` | `{"F": {f: R}}` \
where `p` and `f` are special strings. `p` is the name of any *property* on the current object, where rules of the former shape traverse deeper into the field being tested.
`f` is the name of a *function* which is used to test the value, type etc. of a base (non-object) value of the current field being tested. With this the structure and validity of the fields of an object can be probed with fine detail. 

To decide what properties to check and rule out, the AST for any term can be written with the `pretty` function to a json (e.g. `tree_file.json`) and inspected by hand.
