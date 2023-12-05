// 内网配置
module.exports = {
  apps: [
    // 使用新后台
    // {
    //   name: "gm-tool",
    //   script: "dist/gm-tool/server.js",
    //   env: {
    //     COMMON_VARIABLE: "true",
    //     NODE_ENV: "stage"
    //   },
    //   env_production: {
    //     NODE_ENV: "production"
    //   },
    // },
    {
      name: "crontab",
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
      name: "dating",
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
