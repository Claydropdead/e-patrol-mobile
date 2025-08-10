const { Client } = require('pg');

const connectionString = "postgresql://postgres:311212345@db.xgsffeuluxsmgrhnrusl.supabase.co:5432/postgres";

async function checkBeatPersonnelTable() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check beat_personnel table structure
        const structure = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'beat_personnel'
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 beat_personnel table structure:');
        structure.rows.forEach(row => {
            console.log(`   • ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
        });

        // Get all records
        const records = await client.query('SELECT * FROM beat_personnel');
        console.log(`\n📄 Total beat_personnel records: ${records.rows.length}`);
        
        if (records.rows.length > 0) {
            console.log('\nSample records:');
            records.rows.forEach((row, index) => {
                console.log(`${index + 1}. ${JSON.stringify(row, null, 2)}`);
            });
        }

        // Check if our sample user has any assignments
        const userAssignments = await client.query(`
            SELECT bp.*, b.name as beat_name, p.full_name, p.email 
            FROM beat_personnel bp
            JOIN beats b ON bp.beat_id = b.id
            JOIN personnel p ON bp.personnel_id = p.id
            WHERE p.email = 'sample@email.com'
        `);

        console.log(`\n🎯 Assignments for sample@email.com: ${userAssignments.rows.length}`);
        userAssignments.rows.forEach(row => {
            console.log(`   • Beat: ${row.beat_name} | Status: ${row.status || 'N/A'} | Assigned: ${row.assigned_at || 'N/A'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkBeatPersonnelTable().catch(console.error);
