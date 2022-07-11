import si from 'systeminformation';

console.log('hi');

si.memLayout()
    .then(data => console.log(data))