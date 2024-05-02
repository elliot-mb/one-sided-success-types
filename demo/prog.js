
const delayed = go => {
    (f => x => f(x)(f(x)))(x => 0);
    return go;
}
const normalRunThis = x => 0;
const shouldFail = delayed(0);