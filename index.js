const {URL} = require('url');
const mysql2 = require('mysql2/promise');

if (!process.env.MYSQL_URL) {
    throw new Error('ENV: MYSQL_URL not defined')
}

/**
 * Simple MySQL
 */
class Db {
    /**
     * @param {mysql2.pool} pool mysql2 pool
     * @param {{}} logger moleculer service.logger
     */
    constructor(pool, logger) {
        this._pool = pool;
        this._logger = logger;
        this._logger.debug('MySQL:connect');
    }

    /**
     * @returns {*}
     */
    provider() {
        return this._pool;
    }

    /**
     * Emulate query
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<string>} raw query
     */
    async emu(sql, params = {}) {
        return this._pool.format(sql, params);
    }

    /**
     * Run query
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<*>}
     */
    async query(sql, params = {}) {
        this._logger.debug('MySQL:Query:', { sql, params });
        return await this._pool.query(sql, params);
    }

    /**
     * Fetch array of objects
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<Array>} if no results, return empty array []
     */
    async rows(sql, params = {}) {
        const result = await this.query(sql, params);
        if (!result) return [];
        const [rows] = result;
        return rows;
    }

    /**
     * Fetch row
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<Object>} if no results, return empty object {}
     */
    async row(sql, params = {}) {
        const rows = await this.rows(sql, params);
        if (!rows.length) return {};
        const [row] = rows;
        return row;
    }

    /**
     * Fetch column (first column of query)
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<Array>} if no results, return empty array []
     */
    async col(sql, params = {}) {
        const rows = await this.rows(sql, params);
        if (!rows.length) return [];
        const [prop] = Object.keys(rows[0]);
        return rows.map(i => i[prop]);
    }

    /**
     * Fetch value
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<string|number|null>}
     */
    async val(sql, params = {}) {
        const row = await this.row(sql, params);
        if (!row) return null;
        const [prop] = Object.keys(row);
        return row[prop];
    }

    /**
     * Fetch total found results
     * @returns {Promise<number>}
     */
    async total() {
        return +(await this.val('SELECT FOUND_ROWS()'));
    }

    /**
     * Insert
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<number>} insert id
     */
    async insert(sql, params = {}) {
        const [result] = await this.query(sql, params);
        return result.insertId;
    }

    end() {
        this._pool.end();
        this._logger.debug('MySQL:disconnect');
    }
}

module.exports = {
    created() {
        const url = new URL(process.env.MYSQL_URL);
        url.searchParams.set('namedPlaceholders', '1');
        const pool = mysql2.createPool(url.toString());
        this.db = new Db(pool, this.logger);
    },
    stopped() {
        this.db.end();
    },
};
