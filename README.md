Run yarn or npm i to get dependencies

** To perform analyse and save result **
node index.js analyse all

** To perform analyse and save result filtering out challenge runs **
node index.js analyse all no_challenges

** To download and parse the top X players **
node index.js downloadPlayersList X

** To download an parse a specific player **
node index.js playerName

There are a few other arguements if you look at the bottom of index.js

I haven't included the morgues as they are about 60MB and you shouldn't need them as the parsed data objects are included.
Only download the morgues if you really feel the need to.