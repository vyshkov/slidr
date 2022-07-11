const HORIZONTAL = 1;
const VERTICAL = 2;

const MX = 9.602;
const MY = 21;
const DELTA = 21;

const zeroPad = (num, places = 2) => String(num).padStart(places, ' ');

function getRoot(id = 'root') {
    return document.getElementById(id);
}

function printMatrix(mesh) {
    let res = '';
    for (let j = 0; j < mesh[0].length; j++) {
        for (let i = 0; i < mesh.length; i++) {
            res += zeroPad(mesh[i][j]) + '  ';
        }
        res += '\n';
    }
    console.log(res);
}

function getSize(element) {
    const rect = element.getBoundingClientRect();
    return rect;
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
    return element;
}

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const words = [
    {
        id: 1,
        value: 'Yo',
        weight: 5
    },
    {
        id: 2,
        value: 'zzz',
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
        .map((val, i) => ({ id: 16 + i, value: 'text' + i, weight: 1 }))
);

const sorted = words.sort((a, b) => b.weight - a.weight);
const size = getSize(getRoot());

const meshSizeX = Math.floor(size.width / DELTA);
const meshSizeY = Math.floor(size.height / DELTA);

getRoot().style.width = '200%';
getRoot().style.height = '200%';

const mesh = new Array(meshSizeX)
    .fill(0)
    .map(() => new Array(meshSizeY).fill(0));

const wordsRegistry = {};

async function start() {
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
}

async function update(id, update) {
    await timeout(1000);
    const word = words[id];
    console.log('word!', word);
    const position = wordsRegistry[word.id];
    const element = document.getElementById(`word-${word.id}`);

    clearMesh(mesh, position);

    if (update.weight) {
        word.weight = update.weight;
    }

    const wordSize = getWordSize(word);
    const wordNewPosition = findWordPosition(wordSize, mesh, wordsRegistry);
    if (wordNewPosition) {
        wordsRegistry[word.id] = wordNewPosition;
        console.log('#', wordNewPosition, word);
        fillWordMesh(mesh, wordNewPosition, word);

        element.innerHTML = word.value;
        element.classList.remove('horizontal');
        element.classList.remove('vertical');
        element.classList.remove('weight-1');
        element.classList.remove('weight-2');
        element.classList.remove('weight-3');
        element.classList.remove('weight-4');
        element.classList.remove('weight-5');
        element.classList.add(
            wordNewPosition.direction === HORIZONTAL ? 'horizontal' : 'vertical'
        );

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
        findPossiblePositions;
    }
}

function clearMesh(mesh, position) {
    for (let i = 0; i < position.nextPoint.neededX; i++) {
        for (let j = 0; j < position.nextPoint.neededY; j++) {
            mesh[position.nextPoint.x + i][position.nextPoint.y + j] = 0;
        }
    }
}

start()
    .then(() => printMatrix(mesh))
    .then(() => update(10, { weight: 2 }))
    .then(() => update(10, { weight: 3 }))
    .then(() => update(1, { weight: 1 }))
    .then(() => update(2, { weight: 1 }))
    .then(() => update(11, { weight: 5 }))
    .then(() => update(40, { weight: 5 }))
    .then(() => update(41, { weight: 4 }))
    .then(() => printMatrix(mesh));

function fillWordMesh(mesh, { nextPoint, direction }, word) {
    for (let j = 0; j < nextPoint.neededY; j++) {
        for (let i = 0; i < nextPoint.neededX; i++) {
            mesh[nextPoint.x + i][nextPoint.y + j] = word.id;
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

function getRandomWord(data, mesh, wordSize) {
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

    const keys = Object.keys(data);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return data[randomKey];
}

function pointer({ dx = 1, dy = 0 }, currX, currY, diffX, diffY) {
    let diff = dx === 1 ? diffX : diffY;

    let pos = 0;
    return {
        getDx() {
            return dx;
        },
        getDy() {
            return dy;
        },
        getCurr() {
            return { currX, currY };
        },
        val() {
            return { dx, dy };
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

function checkPoint(pointX, pointY, length, multiplier, matrix, dir = 1) {
    if (pointX < 0 || pointY < 0) {
        return false;
    }

    if (dir === 1) {
        const neededX = Math.ceil((length * multiplier * MX) / DELTA);
        const neededY = Math.ceil((multiplier * MY) / DELTA);

        if (matrix.length - pointX < neededX) {
            return false;
        }

        if (matrix[0].length - pointY < neededY) {
            return false;
        }

        for (let i = 0; i < neededX; i++) {
            for (let j = 0; j < neededY; j++) {
                if (matrix[i + pointX][j + pointY] !== 0) {
                    return false;
                }
            }
        }
    }

    if (dir === 2) {
        const neededX = Math.ceil((multiplier * MY) / DELTA);
        const neededY = Math.ceil((length * multiplier * MX) / DELTA);

        if (matrix.length - pointX < neededX) {
            return false;
        }

        if (matrix[0].length - pointY < neededY) {
            return false;
        }

        for (let i = 0; i < neededX; i++) {
            for (let j = 0; j < neededY; j++) {
                if (matrix[i + pointX][j + pointY] !== 0) {
                    return false;
                }
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

function findWordPosition(wordSize, mesh, wordsRegistry) {
    const randomWord = getRandomWord(wordsRegistry, mesh, wordSize);

    const meshSize = mesh.length * mesh[0].length;
    const { startX, startY } = pointAround(randomWord);
    const diff = Math.abs(mesh.length - mesh[0].length);
    let diffX = mesh.length - mesh[0].length < 0 ? 1 : diff;
    let diffY = mesh.length - mesh[0].length > 0 ? 1 : diff;

    const p = new pointer({ dx: 1, dy: 0 }, startX, startY, diffX, diffY);

    let i = 0;
    while (i < 4 * meshSize) {
        p.iteration();
        const point = p.getCurr();
        if (
            point.currX >= 0 &&
            point.currY >= 0 &&
            point.currX < mesh.length &&
            point.currY < mesh[0].length &&
            mesh[point.currX][point.currY] === 0
        ) {
            if (
                checkPoint(
                    point.currX,
                    point.currY,
                    wordSize.width,
                    wordSize.weight,
                    mesh,
                    1
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
                    direction: HORIZONTAL
                };
            }
            if (
                checkPoint(
                    point.currX,
                    point.currY,
                    wordSize.width,
                    wordSize.weight,
                    mesh,
                    2
                )
            ) {
                return {
                    nextPoint: {
                        x: point.currX,
                        y: point.currY,
                        neededX: Math.ceil((wordSize.weight * MY) / DELTA),
                        neededY: Math.ceil(
                            (wordSize.weight * wordSize.width * MX) / DELTA
                        )
                    },
                    direction: VERTICAL
                };
            }
        }
        i++;
    }
}