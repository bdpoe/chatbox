import mysql from "mysql2/promise";
import { DB_CONFIG } from "./config.js";

export const pool = mysql.createPool(DB_CONFIG);
