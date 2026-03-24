const { db } = require('../config/config'); // Import correctly

const AuthModel = {
  getUserByEmail: async (email) => {
    try {
      const [rows] = await db.query(
        "SELECT user_id, role, name, email FROM master_users WHERE email = ?",
        [email]
      );
      return rows.length > 0 ? rows[0] : null; // Return user if found, else null
    } catch (error) {
      console.error('Database Query Error:', error);
      throw error;
    }
  },
  getUserByEmailAndRole: async (email, role) => {
    try {
      const [rows] = await db.query(
        "SELECT user_id, role, name, email FROM master_users WHERE email = ? AND role = ?",
        [email, role]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database Query Error:', error);
      throw error;
    }
  }
};

module.exports = AuthModel;
 
