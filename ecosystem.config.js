// 生产服配置
module.exports = {
  apps: [
    {
      name: "dating",
      script: "dist/server.js",
      env: {
        COMMON_VARIABLE: "true",
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "crontab",
      script: "dist/schedules.js",
      env: {
        COMMON_VARIABLE: "true",
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
}
