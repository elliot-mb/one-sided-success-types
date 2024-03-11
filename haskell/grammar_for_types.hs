data Var = Num | Arr Var Var | Ok | C Var deriving (Show)

disj :: Var -> Var -> Bool
disj Num Num = False
disj (Arr _ _) (Arr _ _) = False
disj _ _ = True

comp :: Var -> Var
comp (C t) = t
comp t = C t

simp :: Var -> Var
simp (C (C t)) = simp t
simp (C t) = C t
simp t = t

scmp :: Var -> Var
scmp = simp . comp

eqls :: Var -> Var -> Bool
eqls Num Num = True
eqls Ok Ok = True
eqls (Arr s1 t1) (Arr s2 t2) = eqls (simp s1) (simp s2) && eqls (simp t1) (simp t2)
eqls (C t) Num = not (eqls (simp t) Num)
eqls (C t1) (Arr s2 t2) = not (eqls (simp t1) (Arr (simp s2) (simp t2)))
eqls (C t) Ok = not (eqls (simp t) Ok)
eqls t1 (C t2) = eqls (scmp t1) (simp t2) --put the complement on the left to match below 
eqls _ _ = False


-- eqls (C t1) t2 = eqls (comp t1) (comp t2) unsure
-- eqls (t1) (C t2) =  