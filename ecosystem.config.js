module.exports = {
  apps: [
    {
      name: 'HRMS-express-backend',
      script: 'src/server.js',
      cwd: 'C:/Users/Falcon/Desktop/HRMS-copy/HRMS/backend',
      node_args: '--max-old-space-size=4096',
      restart_delay: 2500,
      kill_timeout: 4000,
      min_uptime: '10s',
      max_restarts: 10,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      }
    },
    {
      name: 'HRMS-invoice-backend',
      script: 'venv/Scripts/python.exe',
      args: '-m uvicorn app:app --host 0.0.0.0 --port 8080',
      cwd: 'C:/Users/Falcon/Desktop/HRMS-copy/HRMS/backend/src/modules/invoice'
    },
    {
      name: 'HRMS-frontend',
      script: 'node_modules/vite/bin/vite.js',
      cwd: 'C:/Users/Falcon/Desktop/HRMS-copy/HRMS/frontend',
      args: 'preview --host 0.0.0.0 --port 5173'
    }
  ]
};
