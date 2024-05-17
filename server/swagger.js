const swaggerAutogen = require('swagger-autogen')();


const doc = {
    info: {
        title: 'API Collaboratios',
        description: 'All available API for the Univeristy of Milan WebApp'
    },
    host: 'localhost:3000'
};


const outputFile = './swagger-server.json';
const routes = ['./server.js'];


swaggerAutogen(outputFile, routes, doc);