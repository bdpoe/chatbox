export const PORT = process.env.PORT || 3000;

export const DB_CONFIG = {
  host: process.env.MYSQLHOST || "localhost",
  port: process.env.MYSQLPORT || 3306,
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "admin",
  database: process.env.MYSQLDATABASE || "chatdb",
};
