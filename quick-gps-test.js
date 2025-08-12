/**
 * Quick GPS Test - Direct personnel_locations Table Test
 * 
 * This script will:
 * 1. Check the actual table structure
 * 2. Test inserting GPS data
 * 3. Show you the backend working immediately
 */

const { Client } = require('pg')

// PostgreSQL connection using Supabase pooler
const dbClient = new Client({
  connectionString: 'postgresql://postgres.xgsffeuluxsmgrhnrusl:311212345@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
})

async function testGPSInsertion() {
  console.log('🚔 E-Patrol GPS Test - Direct Database Insert')
  console.log('=' * 50)

  try {
    // Connect to database
    await dbClient.connect()
    console.log('✅ Connected to Supabase database')

    // 1. Check actual table structure
    console.log('\n🔍 Checking personnel_locations table structure:')
    const tableStructureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'personnel_locations' 
      ORDER BY ordinal_position
    `
    
    const tableResult = await dbClient.query(tableStructureQuery)
    if (tableResult.rows.length === 0) {
      console.log('❌ Table personnel_locations does not exist!')
      return
    }

    console.log('   Columns found:')
    tableResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`)
    })

    // 2. Test GPS data insertion
    console.log('\n📍 Testing GPS data insertion:')
    
    // Mock GPS data - Manila coordinates
    const testGPSData = {
      personnel_id: '12345678-1234-1234-1234-123456789012', // Valid UUID format
      latitude: 14.5995,  // Manila
      longitude: 120.9842,
      accuracy: 5.0
    }

    console.log('   GPS Data:', {
      lat: testGPSData.latitude,
      lng: testGPSData.longitude,
      accuracy: testGPSData.accuracy
    })

    // Try UPSERT (based on the app code)
    const upsertQuery = `
      INSERT INTO personnel_locations (personnel_id, latitude, longitude, accuracy, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (personnel_id) 
      DO UPDATE SET 
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        updated_at = NOW()
      RETURNING id, updated_at
    `

    const result = await dbClient.query(upsertQuery, [
      testGPSData.personnel_id,
      testGPSData.latitude,
      testGPSData.longitude,
      testGPSData.accuracy
    ])

    console.log('✅ GPS data inserted/updated successfully!')
    console.log('   Record ID:', result.rows[0].id)
    console.log('   Updated at:', result.rows[0].updated_at)

    // 3. Show recent GPS records
    console.log('\n📊 Recent GPS records in personnel_locations:')
    const recentQuery = 'SELECT * FROM personnel_locations ORDER BY updated_at DESC LIMIT 3'
    const recentResult = await dbClient.query(recentQuery)
    
    recentResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. Personnel: ${row.personnel_id}`)
      console.log(`      Location: (${row.latitude}, ${row.longitude})`)
      console.log(`      Accuracy: ±${row.accuracy}m`)
      console.log(`      Updated: ${new Date(row.updated_at).toLocaleString()}`)
      console.log()
    })

    console.log('🎯 Backend GPS tracking is working!')
    console.log('   ✅ Table exists and accessible')
    console.log('   ✅ GPS data can be inserted/updated')
    console.log('   ✅ UPSERT functionality working')
    console.log('   ✅ Ready for mobile app GPS tracking')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.message.includes('does not exist')) {
      console.log('\n💡 The personnel_locations table might not exist yet.')
      console.log('   Please create it or check the table name.')
    }
  } finally {
    await dbClient.end()
    console.log('\n🔌 Database connection closed')
  }
}

// Run the test
testGPSInsertion()
