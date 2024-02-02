/**
 * 
 * 
 * attempt to extend the pcf like language with blocks and let-rec-like defintions 
 * 
 * values
 * V, W ::= x | n | POSSIBLY REMOVE PAIRS [V, W] | x => M (| null | const f = V;) (extension)
 * 
 * terms
 * M, N ::= x | n | n + m | n - m | POSSIBLY REMOVE PAIRS [M, N] | x => M | M(N) | M <= 0 ? N : P (| const f = M; N | null) (extension)
 * 
 * 
 * (extension)
 * the introduction of definitions means that all the M functions need their
 * own local scope and thus definition set, where a definition set is 
 * 
 * Defs ::= Defs; f = M | epsilon 
 * Defs may be appended with the function name where it is local to the function:
 * e.g. Defs_f would be the defintions M can see when 'const f = M' is typed.
 * a new definition Defs_f set begins in M for 'const f = M; N', 
 * which is always at least Defs_f = {f = M} for recursion
 * 
 * the introduction of null allows functions to return nothing without using undefined (crash)
 * 
 * f => (x => f(v => x(x)(v)))(x => f(v => x(x)(v))) --i can have recursion with the Z combinator
 * we define this with Z ::= f => (x => f(v => x(x)(v)))(x => f(v => x(x)(v)));
 * 
 * 
 * 
 * evaluation contexts 
 * (where you can put values to have the term evaluate)
 * E, F ::= [] | (x => M)(E) | E(N) | E + m | E - m |
 *          n + E | n - E | E <= 0 ? N : P 
 * 
 * binary relation on evaluations
 * s <= 0 ? N : P |> N --where s is less than or equal to zero
 * t <= 0 ? N : P |> P --where t is greater than zero
 * n + m |> u --where u is the sum of n and m
 * n - m |> v --where v is n subract m
 * (x => M)V |> M[V/x]
 * 
 * types 
 * A, B ::= number | A x B | A -> B | A^c | Ok 
 * 
 * constant types 
 * Cs = { <= 0 ?: Num -> A -> A -> A,  } --the branches must have the same type 
 * because it will require many more rules to reason with the type otherwise
 * 
 * things i can  do 
 * - read up on one-sided type inference (book suggested)
 * - read up on names in lambda calculus (notes suggested)
 * - learn about cons and constructor types 
 * 
 */