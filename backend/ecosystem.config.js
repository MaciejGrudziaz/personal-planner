module.exports = {
    apps: [{
        name: "personal-planner-backend",
        script: "main.js",
        restart_delay: 5000,
        env: {
            NODE_ENV: "development"
        },
        env_production: {
            NODE_ENV: "production"
        }
    }]
}

