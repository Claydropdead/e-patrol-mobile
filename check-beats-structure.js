const { Client } = require('pg');

const connectionString = "postgresql://postgres:311212345@db.xgsffeuluxsmgrhnrusl.supabase.co:5432/postgres";

async function checkBeatsTable() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check beats table structure
        const structure = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'beats'
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 beats table structure:');
        structure.rows.forEach(row => {
            console.log(`   • ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
        });

        // Get a sample beat record
        const sampleBeat = await client.query('SELECT * FROM beats LIMIT 1');
        console.log('\n📄 Sample beat record:');
        if (sampleBeat.rows.length > 0) {
            console.log(JSON.stringify(sampleBeat.rows[0], null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkBeatsTable().catch(console.error);
