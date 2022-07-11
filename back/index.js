import Fastify from 'fastify';
import staticFiles from '@fastify/static';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { v4 } from 'uuid';

import { WebSocketServer } from 'ws';

import questions from './questions.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const wss = new WebSocketServer({ port: 7071 });

const clients = new Map();

let session = { '1': { '0': 0, '1': 0, '2': 0, '3': 0} };

wss.on('connection', (ws) => {
  const id = v4();
  const color = Math.floor(Math.random() * 360);
  const metadata = { id, color, ping: 5, ws };

  clients.set(id, metadata);
  let qn = '1';
  ws.send(JSON.stringify({
    type: 'update',
    qn,
    data: session[qn]
  }))

  ws.on('message', (messageAsString) => {
    if (messageAsString.toString() === 'pong') {
      if ( clients.get(id)) {
        clients.get(id).ping=5;
      } else {
        ws.close();
      }
      
    } else {
      const message = JSON.parse(messageAsString.toString());
      console.log('>>>', message)
      session[message.qn][message.value]++;
      broadcastSessionUpdate(message.qn);
    }
  });
});

function broadcastSessionUpdate(qn) {
  for(const key of clients.keys()) { 
    clients.get(key).ws.send(JSON.stringify({
      type: 'update',
      qn,
      data: session[qn]
    }));
  }
}


ping();

function ping() {
  setInterval(() => {
    for(const key of clients.keys()) { 
      clients.get(key).ws.send('ping');
      clients.get(key).ping--;
      if(clients.get(key).ping < 1) {
        clients.delete(key);
        console.log('!removed', key)
      }
    }
  }, 1000)
}



// ----- rest 


const fastify = Fastify({
  logger: true
});

fastify.register(staticFiles, {
  root: join(__dirname, '../front'),
  prefix: '/embed/', 
})

// Declare a route
fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world234' })
})

fastify.get('/question', function (request, reply) {
  reply.send(questions[0])
})

fastify.get('/meta', function (request, reply) {
  reply.send(questions[0])
})




// Run the server!
fastify.listen(8080, '0.0.0.0', function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  // Server is now listening on ${address}
})