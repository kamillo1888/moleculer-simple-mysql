# Moleculer Simple MySQL Mixin

## Prepare
Set env MYSQL_URL (see: example.env)

## Use
In service
```javascript
const Db = require('moleculer-simple-mysql');
module.exports = {
    name: 'test',
    mixins: [Db],
    actions: {
        test: {
            rest: {method:'POST'},
            handler() {
                // Direct return promise
                return this.db.val(`SELECT NOW()`);            
            }        
        },
        test2: {
            rest: {method:'POST'},
            async handler() {
                // async/await
                const now = await this.db.val(`SELECT NOW()`); 
                return `Now: ${now}`;             
            }        
        }       
    }
};
```