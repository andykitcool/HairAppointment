// MongoDB Shell Script - Initialize development-like seed data
// Usage:
// docker compose --profile init up db-seed
// or
// docker exec -i hair-mongo mongosh < scripts/init-dev-data-mongo.js

/* global db */

const seedDb = db.getSiblingDB('hair_appointment')
const now = new Date()

// bcrypt hash for "123456"
const passwordHash = '$2a$10$poGLcuLu9ubLPSjOti8LWO9rdaSoMdFLeau8Fo8Nob7UnbiQrGw4y'

const merchantId = 'MDEMO001'

// 1) Super admin
print('[seed] upsert super admin...')
seedDb.admins.updateOne(
  { username: 'admin' },
  {
    $set: {
      password_hash: passwordHash,
      real_name: 'Super Admin',
      phone: '13800000000',
      email: '',
      is_active: true,
      role: 'super_admin',
      type: 'system',
      merchant_id: '',
      update_time: now,
    },
    $setOnInsert: {
      create_time: now,
    },
  },
  { upsert: true }
)

// 2) Owner admin
print('[seed] upsert owner admin...')
seedDb.admins.updateOne(
  { username: 'owner_demo' },
  {
    $set: {
      password_hash: passwordHash,
      real_name: 'Demo Owner',
      phone: '13900000000',
      email: '',
      is_active: true,
      role: 'owner',
      type: 'merchant',
      merchant_id: merchantId,
      update_time: now,
    },
    $setOnInsert: {
      create_time: now,
    },
  },
  { upsert: true }
)

const ownerAdmin = seedDb.admins.findOne({ username: 'owner_demo' })
const ownerAdminId = ownerAdmin ? String(ownerAdmin._id) : ''

// 3) Merchant
print('[seed] upsert merchant...')
seedDb.merchants.updateOne(
  { merchant_id: merchantId },
  {
    $set: {
      name: 'Demo Hair Salon',
      address: 'Beijing Chaoyang Demo Road 100',
      phone: '13900000000',
      status: 'active',
      description: 'Seed merchant for deployment smoke test',
      owner_id: ownerAdminId,
      daily_counter: 0,
      counter_date: now.toISOString().slice(0, 10),
      update_time: now,
    },
    $setOnInsert: {
      create_time: now,
    },
  },
  { upsert: true }
)

// 4) Users
print('[seed] upsert users...')
seedDb.users.updateOne(
  { user_id: 'UDEMOOWNER' },
  {
    $set: {
      openid: 'openid_demo_owner',
      union_id: 'union_demo_owner',
      nickname: 'Demo Owner User',
      avatar_url: '',
      phone: '13900000000',
      role: 'owner',
      merchant_id: merchantId,
      membership_level: 'normal',
      points: 0,
      punch_card_remaining: 0,
      stored_value_balance: 0,
      visit_count: 0,
      total_spending: 0,
      update_time: now,
    },
    $setOnInsert: {
      create_time: now,
    },
  },
  { upsert: true }
)

seedDb.users.updateOne(
  { user_id: 'UDEMOCUST1' },
  {
    $set: {
      openid: 'openid_demo_customer_1',
      union_id: 'union_demo_customer_1',
      nickname: 'Demo Customer A',
      avatar_url: '',
      phone: '13700000001',
      role: 'customer',
      merchant_id: merchantId,
      membership_level: 'normal',
      points: 120,
      punch_card_remaining: 0,
      stored_value_balance: 200,
      visit_count: 3,
      total_spending: 899,
      update_time: now,
    },
    $setOnInsert: {
      create_time: now,
    },
  },
  { upsert: true }
)

// 5) Services
print('[seed] upsert services...')
const services = [
  {
    service_id: 'SDEMO001',
    name: 'Haircut Premium',
    category: 'cut',
    price: 88,
    total_duration: 45,
    staff_busy_duration: 45,
    stages: [
      { name: 'Consult', duration: 10, staff_busy: true },
      { name: 'Cut', duration: 25, staff_busy: true },
      { name: 'Style', duration: 10, staff_busy: true },
    ],
    sort_order: 1,
  },
  {
    service_id: 'SDEMO002',
    name: 'Perm Fashion',
    category: 'perm',
    price: 298,
    total_duration: 150,
    staff_busy_duration: 70,
    stages: [
      { name: 'Consult', duration: 10, staff_busy: true },
      { name: 'Prep', duration: 40, staff_busy: true },
      { name: 'Wait', duration: 60, staff_busy: false },
      { name: 'Finish', duration: 40, staff_busy: true },
    ],
    sort_order: 2,
  },
  {
    service_id: 'SDEMO003',
    name: 'Color Trend',
    category: 'dye',
    price: 268,
    total_duration: 130,
    staff_busy_duration: 60,
    stages: [
      { name: 'Consult', duration: 10, staff_busy: true },
      { name: 'Apply', duration: 40, staff_busy: true },
      { name: 'Wait', duration: 50, staff_busy: false },
      { name: 'Rinse', duration: 30, staff_busy: true },
    ],
    sort_order: 3,
  },
]

services.forEach((svc) => {
  seedDb.services.updateOne(
    { service_id: svc.service_id },
    {
      $set: {
        merchant_id: merchantId,
        is_active: true,
        description: '',
        update_time: now,
        ...svc,
      },
      $setOnInsert: {
        create_time: now,
      },
    },
    { upsert: true }
  )
})

// 6) Staff
print('[seed] upsert staff...')
seedDb.staff.updateOne(
  { staff_id: 'STDEMO001' },
  {
    $set: {
      merchant_id: merchantId,
      user_id: ownerAdminId,
      name: 'Demo Owner',
      title: 'Owner',
      phone: '13900000000',
      avatar_url: '',
      service_ids: ['SDEMO001', 'SDEMO002', 'SDEMO003'],
      is_active: true,
      update_time: now,
    },
    $setOnInsert: {
      create_time: now,
    },
  },
  { upsert: true }
)

seedDb.staff.updateOne(
  { staff_id: 'STDEMO002' },
  {
    $set: {
      merchant_id: merchantId,
      user_id: '',
      name: 'Demo Stylist',
      title: 'Senior Stylist',
      phone: '13600000002',
      avatar_url: '',
      service_ids: ['SDEMO001', 'SDEMO003'],
      is_active: true,
      update_time: now,
    },
    $setOnInsert: {
      create_time: now,
    },
  },
  { upsert: true }
)

// 7) Platform defaults
print('[seed] upsert platform config...')
seedDb.platformconfigs.updateOne(
  { config_key: 'platform_default' },
  {
    $set: {
      coze_config: {
        enabled: false,
        api_key: '',
        model: 'doubao-seedream-5-0-260128',
        prompt: '',
        size: '2K',
      },
      amap_config: {
        enabled: false,
        js_api_key: '',
        security_js_code: '',
        service_host: '',
        web_service_key: '',
      },
      email_config: {
        enabled: false,
        host: '',
        port: 465,
        secure: true,
        user: '',
        pass: '',
        from_name: '',
        from_email: '',
      },
      update_time: now,
    },
    $setOnInsert: {
      create_time: now,
    },
  },
  { upsert: true }
)

print('\n[seed] done')
print('SuperAdmin: admin / 123456')
print('OwnerAdmin: owner_demo / 123456')
print('MerchantId: ' + merchantId)
