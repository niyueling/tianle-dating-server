// 内网配置
module.exports = {
  apps: [
    {
      name: "crontab-stage",
      script: "dist/schedules.js",
      env: {
        COMMON_VARIABLE: "true",
        NODE_ENV: "stage"
      },
      env_production: {
        NODE_ENV: "production"
      },
    },
    {
      // 大厅服
      name: "dating-stage",
      script: "dist/server.js",
      env: {
        COMMON_VARIABLE: "true",
        NODE_ENV: "stage"
      },
      env_production: {
        NODE_ENV: "production"
      },
    },
  ],
}
