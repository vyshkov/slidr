const HORIZONTAL = 1;
const VERTICAL = 2;

const MX = 9.602;
const MY = 21;
const DELTA = 21;

const data = [
    {
        id: 0,
        value: "zero",
        weight: 1
    },
    {
        id: 1,
        value: 'Yo',
        weight: 5
    },
    {
        id: 2,
        value: 'ABC',
        weight: 4
    },
    {
        id: 3,
        value: 'Lets drink beer',
        weight: 4
    },
    {
        id: 4,
        value: 'Yo nigga',
        weight: 3
    },
    {
        id: 5,
        value: 'hello',
        weight: 3
    },
    {
        id: 6,
        value: 'Yo yoyoy',
        weight: 3
    },
    {
        id: 7,
        value: 'Yo yoyoyoyoy',
        weight: 3
    },
    {
        id: 8,
        value: 'Tuna',
        weight: 2
    },
    {
        id: 9,
        value: 'Hawe awehawe whewqe hwe',
        weight: 1
    },
    {
        id: 10,
        value: 'Loller 75',
        weight: 1
    },
    {
        id: 11,
        value: '=)',
        weight: 1
    },
    {
        id: 12,
        value: 'Yo yoyoyoyoy',
        weight: 3
    },
    {
        id: 13,
        value: 'Tudddna',
        weight: 2
    },
    {
        id: 14,
        value: 'Hawe a  sdf wehawe whewqe hwe',
        weight: 1
    },
    {
        id: 15,
        value: 'Lsdfsdfsdf5',
        weight: 1
    },
    {
        id: 16,
        value: '=-)',
        weight: 1
    }
].concat(
    new Array(50)
        .fill(0)
        .map((_, i) => ({ id: 17 + i, value: 'text' + (17+i), weight: 1 }))
);

const zeroPad = (num, places = 2) => String(num).padStart(places, ' ');

function getRoot(id = 'root') {
    return document.getElementById(id);
}

function printMatrix(props) {
    const mesh = props.mesh;
    let res = '';
    for (let j = 0; j < mesh[0].length; j++) {
        for (let i = 0; i < mesh.length; i++) {
            res += mesh[i][j] === null ? '..  ' : zeroPad(mesh[i][j][0]) + '  ';
        }
        res += '\n';
    }
    console.log(res);
    return props;
}

function getSize(element) {
    return element.getBoundingClientRect();;
}

function createElement(text, className, size, direction) {
    const element = document.createElement('div');
    element.innerHTML = text + direction || '-';
    if (className) element.classList.add(className);
    if (size) {
        element.classList.add(`size-${size}`);
    }
    if (direction) {
        element.classList.add(`direction-${direction}`);
    }
    element.title = className;
    return element;
}

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function removeFromMesh(mesh, wordsRegistry, id) {
    const position = wordsRegistry[id] ;
    for (let i = 0; i < position.nextPoint.neededX; i++) {
        for (let j = 0; j < position.nextPoint.neededY; j++) {
            if (mesh[position.nextPoint.x + i][position.nextPoint.y + j] && mesh[position.nextPoint.x + i][position.nextPoint.y + j][0] === id) {
                mesh[position.nextPoint.x + i][position.nextPoint.y + j] = null;
            }
        }
    }
}

function getWordsOnArea({ x, y, width, height }, { words, mesh, wordsRegistry }) {
    const res = {};

    for (let i = x; i < x + width; i ++) {
        for (let j = y; j < y + height; j++) {
            if (mesh[i][j] && !res[mesh[i][j][0]]) {
                res[mesh[i][j][0]] = wordsRegistry[mesh[i][j][0]]
            }
        }
    }

    return res;
}

async function update(id, upd, { words, mesh, wordsRegistry }, ignoreWeight = 0, time = 1000, top = true, cache = {}) {
    await timeout(time);
    const word = words.find(word => word.id === id);
    removeFromMesh(mesh, wordsRegistry, id)
    
    if (upd.weight) {
        word.weight = upd.weight;
    }

    const wordSize = getWordSize(word);
    const wordNewPosition = findWordPosition(wordSize, mesh, wordsRegistry, ignoreWeight);
   
    if (wordNewPosition) {
        wordsRegistry[word.id] = wordNewPosition;
        cache[word.id] = wordNewPosition;

        const wordsBehind = getWordsOnArea(
            { 
                x: wordNewPosition.nextPoint.x,
                y: wordNewPosition.nextPoint.y,
                width: wordNewPosition.nextPoint.neededX,
                height: wordNewPosition.nextPoint.neededY,
            },{ words, mesh, wordsRegistry }
        );

        fillWordMesh(mesh, wordNewPosition, word);

        for(let key of Object.keys(wordsBehind)) {
            await update(Number(key), {}, { words, mesh, wordsRegistry }, ignoreWeight > 0 ? ignoreWeight - 1 : 0, 0, false, cache)
        }      
    } else {
        console.warn('No space for', word, 'needed X=', word.weight * word.value.length, 'needed Y=', word.weight,'matrixX', mesh.length, 'matrixY', mesh[0].length);
        //findPossiblePositions;
    }


    if (top) {
        const keys = Object.keys(cache);

        for (key of keys) {
            const element = document.getElementById(`word-${key}`);
            //element.innerHTML = word.value;
            element.classList.remove(
                'horizontal',
                'vertical',
                'weight-1',
                'weight-2',
                'weight-3',
                'weight-4',
                'weight-5'
            );
    
    
            element.classList.add(
                cache[key].direction === HORIZONTAL ? 'horizontal' : 'vertical'
            );
    
            element.classList.add(`weight-${cache[key].weight}`);
            element.style.top = `${
                cache[key].direction === HORIZONTAL
                    ? cache[key].nextPoint.y * DELTA
                    : cache[key].nextPoint.y * DELTA
            }px`;
            element.style.left = `${
                cache[key].direction === HORIZONTAL
                    ? cache[key].nextPoint.x * DELTA
                    : cache[key].nextPoint.x * DELTA
            }px`;
        }
    }

    return { words, mesh, wordsRegistry };
}

function clearMesh(mesh, position) {
    for (let i = 0; i < position.nextPoint.neededX; i++) {
        for (let j = 0; j < position.nextPoint.neededY; j++) {
            mesh[position.nextPoint.x + i][position.nextPoint.y + j] = null;
        }
    }
}

function fillWordMesh(mesh, { nextPoint }, word) {
    for (let j = 0; j < nextPoint.neededY; j++) {
        for (let i = 0; i < nextPoint.neededX; i++) {
            mesh[nextPoint.x + i][nextPoint.y + j] = [word.id, word.weight];
        }
    }
}

function getWordSize(word) {
    return {
        width: word.value.length,
        height: 1,
        weight: word.weight
    };
}

function getRandomWord(wordsRegistry, mesh, wordSize) {
    if (Object.keys(wordsRegistry).length === 0) {
        return {
            nextPoint: {
                x: Math.floor(
                    mesh.length / 2 -
                        (wordSize.width * wordSize.weight * MX) / (2 * DELTA)
                ),
                y: Math.floor(mesh[0].length / 2)
            }
        };
    } else if (Object.keys(wordsRegistry).length < 10) {
        return {
            nextPoint: {
                x: Math.floor(Math.random() * mesh.length),
                y: Math.floor(Math.random() * mesh[0].length)
            }
        };
    }

    const keys = Object.keys(wordsRegistry);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return wordsRegistry[randomKey];
}

function Pointer(currX, currY, diffX, diffY) {
    let dx = diffX > diffY ? 1 : 0;
    let dy = diffX > diffY ? 0 : 1;

    let diff = Math.max(diffX, diffY);
    
    let pos = 0;
    return {
        getCurr() {
            return { currX, currY };
        },
        next() {
            if (dx === 1 && dy === 0) {
                dx = 0;
                dy = 1;
                diffX++;
                diff = diffY;
                pos = 0;
            } else if (dx === 0 && dy === 1) {
                dx = -1;
                dy = 0;
                diffY++;
                diff = diffX;
                pos = 0;
            } else if (dx === -1 && dy === 0) {
                dx = 0;
                dy = -1;
                diffX++;
                diff = diffY;
                pos = 0;
            } else if (dx === 0 && dy === -1) {
                dx = 1;
                dy = 0;
                diffY++;
                diff = diffX;
                pos = 0;
            }
        },
        iteration() {
            if (pos >= diff) {
                this.next();
            }

            pos++;
            currX += dx;
            currY += dy;
        }
    };
}

function checkPoint(
    pointX,
    pointY,
    length,
    multiplier,
    matrix,
    dir = HORIZONTAL,
    ignoreWeight = 0,
) {
    if (pointX < 0 || pointY < 0) {
        return false;
    }

    let s1 = Math.ceil((length * multiplier * MX) / DELTA);
    let s2 = Math.ceil((multiplier * MY) / DELTA);

    const neededX = dir === HORIZONTAL ? s1 : s2;
    const neededY = dir === HORIZONTAL ? s2 : s1;

    if (matrix.length - pointX < neededX) {
        return false;
    }

    if (matrix[0].length - pointY < neededY) {
        return false;
    }

    for (let i = 0; i < neededX; i++) {
        for (let j = 0; j < neededY; j++) {
            if (matrix[i + pointX][j + pointY] !== null && matrix[i + pointX][j + pointY][1] > ignoreWeight) {
                return false;
            }
        }
    }

    return true;
}

function pointAround(randomWord) {
    const startX = randomWord.nextPoint.x + Math.floor(Math.random() * 5) - 2;
    const startY = randomWord.nextPoint.y + Math.floor(Math.random() * 5) - 1;
    return { startX, startY };
}

function findWordPosition(wordSize, mesh, wordsRegistry, ignoreWeight = 0) {
    const randomWord = getRandomWord(wordsRegistry, mesh, wordSize);

    const meshSize = mesh.length * mesh[0].length;
    const { startX, startY } = pointAround(randomWord);
    const diff = Math.abs(mesh.length - mesh[0].length);
    let diffX = mesh.length - mesh[0].length < 0 ? 1 : diff;
    let diffY = mesh.length - mesh[0].length > 0 ? 1 : diff;

    const p = new Pointer(startX, startY, diffX, diffY);
    
    let i = 0;
    while (i < 6 * meshSize) {
        p.iteration();
        const point = p.getCurr();
        
        if (
            point.currX >= 0 &&
            point.currY >= 0 &&
            point.currX < mesh.length &&
            point.currY < mesh[0].length &&
            (mesh[point.currX][point.currY] === null || (mesh[point.currX][point.currY] && (mesh[point.currX][point.currY][1] >= ignoreWeight)))
        ) {
            if (
                checkPoint(
                    point.currX,
                    point.currY,
                    wordSize.width,
                    wordSize.weight,
                    mesh,
                    HORIZONTAL,
                    ignoreWeight
                )
            ) {
                return {
                    nextPoint: {
                        x: point.currX,
                        y: point.currY,
                        neededX: Math.ceil(
                            (wordSize.width * wordSize.weight * MX) / DELTA
                        ),
                        neededY: Math.ceil((wordSize.weight * MY) / DELTA)
                    },
                    direction: HORIZONTAL,
                    weight: wordSize.weight
                };
            }
            if (
                checkPoint(
                    point.currX,
                    point.currY,
                    wordSize.width,
                    wordSize.weight,
                    mesh,
                    VERTICAL,
                    ignoreWeight
                )
            ) {
                return {
                    nextPoint: {
                        x: point.currX,
                        y: point.currY,
                        neededX: Math.ceil((wordSize.weight * MY) / DELTA),
                        neededY: Math.ceil(
                            (wordSize.weight * wordSize.width * MX) / DELTA
                        ),
                    },
                    direction: VERTICAL,
                    weight: wordSize.weight
                };
            }
        }
        i++;
    }
}

// App
async function start(words) {
    const sorted = words.sort((a, b) => b.weight - a.weight);
    const size = getSize(getRoot());
    
    const meshSizeX = Math.floor(size.width / DELTA);
    const meshSizeY = Math.floor(size.height / DELTA);
    
    const mesh = new Array(meshSizeX)
        .fill(0)
        .map(() => new Array(meshSizeY).fill(null));
    
    const wordsRegistry = {};

    getRoot().style.width = '200%';
    getRoot().style.height = '200%';

    for (let word of sorted) {
        const wordSize = getWordSize(word);
        const wordNewPosition = findWordPosition(wordSize, mesh, wordsRegistry);

        if (wordNewPosition) {
            wordsRegistry[word.id] = wordNewPosition;
            fillWordMesh(mesh, wordNewPosition, word);

            const element = document.createElement('div');
            element.innerHTML = word.value;
            element.id = `word-${word.id}`;
            element.classList.add('word');
            element.classList.add(
                wordNewPosition.direction === HORIZONTAL
                    ? 'horizontal'
                    : 'vertical'
            );
            element.style.opacity = 0;
            getRoot().appendChild(element);
            await timeout(90);
            element.style.opacity = 1;
            element.classList.add(`weight-${word.weight}`);
            element.style.top = `${
                wordNewPosition.direction === HORIZONTAL
                    ? wordNewPosition.nextPoint.y * DELTA
                    : wordNewPosition.nextPoint.y * DELTA
            }px`;
            element.style.left = `${
                wordNewPosition.direction === HORIZONTAL
                    ? wordNewPosition.nextPoint.x * DELTA
                    : wordNewPosition.nextPoint.x * DELTA
            }px`;
        } else {
            console.warn('No space for', word);
        }
    }

    return { words, mesh, wordsRegistry };
}

start(data)
    .then(props => printMatrix(props))
    .then(props => update(10, { weight: 2 }, props, 1))
    .then(props => update(10, { weight: 3 }, props, 2))
    .then(props => update(1, { weight: 1 }, props))
    .then(props => update(2, { weight: 1 }, props))
    .then(props => update(11, { weight: 5 }, props, 4))
    .then(props => update(40, { weight: 5 }, props, 4))
    .then(props => update(41, { weight: 4 }, props, 3))
    .then(props => printMatrix(props))
    // .then(props => console.log(getWordsOnArea({ x: 3, y: 3, width: 5, height: 5 }, props)));


    // const mesh = new Array(16).fill(0).map(() => new Array(4).fill(0).map(() => [0]));

    // printMatrix({ mesh });

    // const startX = 2;
    // const startY = 2;

    // const diff = Math.abs(mesh.length - mesh[0].length);
    // let diffX = mesh.length - mesh[0].length < 0 ? 1 : diff;
    // let diffY = mesh.length - mesh[0].length > 0 ? 1 : diff;

    // const p = new Pointer(startX, startY, diffX, diffY);

    // for (let i = 0; i < 80; i++) {
      
    //    const point = p.getCurr();
    //    console.log(point);
    //    if (mesh[point.currX] && mesh[point.currX][point.currY] ) {
    //     mesh[point.currX][point.currY][0] = i + 1;
    //    }
    //    p.iteration();
    // }

    // printMatrix({ mesh });


