// MongoDB Shell Script - Create Super Admin
// Run: docker exec -i hair-mongo mongosh < init-admin-mongo.js

db = db.getSiblingDB('hair_appointment');

// bcrypt hash for "123456":
const passwordHash = '$2a$10$poGLcuLu9ubLPSjOti8LWO9rdaSoMdFLeau8Fo8Nob7UnbiQrGw4y';

// Check if admin exists
const existingAdmin = db.admins.findOne({ username: 'admin' });

if (existingAdmin) {
  print('Admin exists, updating password...');
  db.admins.updateOne(
    { username: 'admin' },
    { 
      $set: { 
        password_hash: passwordHash,
        real_name: 'Super Admin',
        is_active: true,
        update_time: new Date()
      } 
    }
  );
} else {
  print('Creating admin account...');
  db.admins.insertOne({
    username: 'admin',
    password_hash: passwordHash,
    real_name: 'Super Admin',
    is_active: true,
    create_time: new Date(),
    update_time: new Date()
  });
}

print('Done!');
print('Account: admin / 123456');
