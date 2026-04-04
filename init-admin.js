/**
 * 初始化超级管理员账号
 * 使用: node init-admin.js
 */
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27018/hair_appointment';

async function initAdmin() {
  console.log('Connecting to MongoDB...');
  console.log('URI:', MONGO_URI);
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected successfully!');
    
    const db = client.db();
    const adminsCollection = db.collection('admins');
    
    // 检查是否已存在 admin 账号
    const existingAdmin = await adminsCollection.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin account already exists. Updating password...');
      
      // 更新密码
      const passwordHash = await bcrypt.hash('123456', 10);
      await adminsCollection.updateOne(
        { username: 'admin' },
        { 
          $set: { 
            password_hash: passwordHash,
            real_name: '超级管理员',
            is_active: true,
            update_time: new Date()
          } 
        }
      );
      console.log('Admin password updated successfully!');
    } else {
      // 创建新的 admin 账号
      const passwordHash = await bcrypt.hash('123456', 10);
      
      const adminDoc = {
        username: 'admin',
        password_hash: passwordHash,
        real_name: '超级管理员',
        is_active: true,
        create_time: new Date(),
        update_time: new Date()
      };
      
      const result = await adminsCollection.insertOne(adminDoc);
      console.log('Admin account created successfully!');
      console.log('ID:', result.insertedId);
    }
    
    console.log('\n✅ Super Admin Account:');
    console.log('   Username: admin');
    console.log('   Password: 123456');
    console.log('   Role: super_admin');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDone!');
  }
}

initAdmin();
