const os = require('os');
module.exports = {
    apps: [{
        port        : 5000,
        name        : "any",
        script      : "server.mjs",
        watch       : true,           
        instances   : os.cpus().length,
        exec_mode   : 'fork',         
        env: {
            NODE_ENV: "production",
        }
    }]
}