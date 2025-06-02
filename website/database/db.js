const { Pool } = require('pg')

const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'perspective_site',
    password: 'admin',
    port: 5433,
})

module.exports = pool;