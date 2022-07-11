// Constants
const COLORS = ['#FFAA00', '#AA0088', '#00BB33', '#11AA66'];

// Utils
function EventEmitter() {
    const subscribers = {};
    return {
        emit: (type, message) => {
            if (subscribers[type]) {
                subscribers[type].forEach((s) => s(message));
            }
        },
        subscribe: (type, subscriber) => {
            if (!subscribers[type]) {
                subscribers[type] = [];
            }
            subscribers[type].push(subscriber);
        }
    };
}

function createState(defautState = {}) {
    const subscribers = [];
    let state = defautState;
    return {
        getState: () => state,
        subscribe: (subscriber) => subscribers.push(subscriber),
        updateState: (cb) => {
            const prevState = state;
            state = cb(state);
            subscribers.forEach((s) => s(state, prevState));
        }
    };
}

function getRoot() {
    return document.getElementById('question');
}

function getStatusElement() {
    return document.getElementById('status');
}

function chainError(err) {
    return Promise.reject(err);
}

// Components
function PollComponent({ state, prevState }) {
    const question = state.question;
    const session = state.session || { data: {} };
    const max = Math.max(...Object.values(session.data));
    const percentsMap = Object.keys(session.data).reduce((obj, key) => {
        return { ...obj, [key]: (session.data[key] * 100) / max };
    }, {});

    return {
        customUpdate: () =>
            state.question &&
            prevState.question &&
            state.session &&
            prevState.session &&
            prevState.question.id === state.question.id &&
            prevState.session.qn === state.session.qn,
        render: () =>
            `
                <div class="question-title">${question.title}</div>
                <div class="responses">
                    <div class="chart">
                        ${question.responses
                            .map(
                                (r, i) =>
                                    `<div class="chart-bar" title="${r}">
                                    <div class="chart-vote">
                                        <div class="chart-vote-value" style="height: ${
                                            percentsMap[i]
                                        }%; background-color: ${COLORS[i]}">${
                                        session.data[i] || 0
                                    }</div>
                                    </div>
                                </div>`
                            )
                            .join('')}
                    </div>
                    <div class="chart-labels">
                        ${question.responses
                            .map(
                                (r, i) => `<div class="chart-label">${r}</div>`
                            )
                            .join('')}
                    </div>
                    ${question.responses
                        .map(
                            (r, i) =>
                                `<div class="response"><button>${r}</button></div>`
                        )
                        .join('')}
                </div>
            
            `,
        applyHandlers: () => {
            const btns = document.getElementsByClassName('response');
            for (let i = 0; i < btns.length; i++) {
                btns[i].addEventListener('click', () =>
                    emitter.emit('event', {
                        qn: question,
                        data: i
                    })
                );
            }
        },
        update: () => {
            const elements =
                document.getElementsByClassName('chart-vote-value');
            for (let i = 0; i < elements.length; i++) {
                elements[i].innerHTML = session.data[i];
                elements[i].style.height = `${percentsMap[i]}%`;
            }
        }
    };
}

// APP logic:

const globasState = createState({
    question: null
});

let emitter = new EventEmitter();

globasState.subscribe((state, prevState) => {
    console.log(state);
    const root = getRoot();
    if (!state.question) {
        root.innerHTML = `no question`;
        return;
    }
    const comp = PollComponent({ state, prevState });
    if (comp.customUpdate()) {
        comp.update();
    } else {
        root.innerHTML = comp.render();
        comp.applyHandlers();
        root.classList.add('test');
    }
});

function loadQuestion() {
    return fetch('/question')
        .then((resp) => {
            if (!resp.ok) {
                console.log('resp', resp);
                throw new Error('Failed to fetch');
            }
            return resp;
        })
        .then((resp) => resp.json());
}

function connect() {
    let ping = 5;
    const socket = new WebSocket(`ws://${location.hostname}:7071/`);
    socket.onopen = function () {
        console.log('Connected...');
        getStatusElement().classList.add('connected');
        getStatusElement().innerHTML = 'Connected!';

        emitter.subscribe('event', (data) => {
            socket.send(
                JSON.stringify({
                    type: 'vote',
                    qn: data.qn.id,
                    value: data.data
                })
            );
        });

        const interval = setInterval(() => {
            ping--;
            if (ping < 1) {
                getStatusElement().innerHTML = 'Disconnected';
                getStatusElement().classList.remove('connected');
                clearInterval(interval);
            }
        }, 1000);
    };
    socket.onmessage = function (event) {
        if (event.data === 'ping') {
            ping = 5;
            socket.send('pong');
        } else {
            const message = JSON.parse(event.data);
            console.log('message ', message);
            globasState.updateState((oldState) => ({
                ...oldState,
                session: message
            }));
        }
    };

    socket.onerror = function (error) {
        console.error('Error: ' + error.message);
    };
}

// INIT
loadQuestion()
    .then((question) => {
        globasState.updateState(() => ({
            question
        }));
    })
    .then(connect)
    .catch((error) => {
        console.error('Shit!', error);
        return Promise.reject();
    });
