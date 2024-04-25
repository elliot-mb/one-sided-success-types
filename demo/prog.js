const snd = x => y => y;
const pair = m => n => p => p(m)(n);
const confusedList = pair(0)(0)(0);