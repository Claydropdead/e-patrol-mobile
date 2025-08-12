const { Client } = require('pg')

// Check actual table structure
async function checkTableStructure() {
  const dbClient = new Client({
    connectionString: 'postgresql://postgres.xgsffeuluxsmgrhnrusl:311212345@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  })

  try {
    await dbClient.connect()
    console.log('✅ Connected to database')

    // Get exact table structure
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'personnel_locations' 
      ORDER BY ordinal_position
    `
    
    const result = await dbClient.query(query)
    
    console.log('\n📋 personnel_locations table structure:')
    result.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`)
    })

    // Also check if table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'personnel_locations'
      )
    `
    const existsResult = await dbClient.query(tableExistsQuery)
    console.log('\nTable exists:', existsResult.rows[0].exists)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await dbClient.end()
  }
}

checkTableStructure()
