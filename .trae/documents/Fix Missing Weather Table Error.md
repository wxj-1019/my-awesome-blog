## Problem
The `weather` table doesn't exist in the database, causing the error: `relation "weather" does not exist` when the weather update service tries to query it.

## Root Cause
The Alembic migration file `010_add_weather_table.py` exists but hasn't been applied to the database.

## Solution
Run the Alembic migration to create the weather table:

1. **Navigate to the backend directory**
   ```bash
   cd e:\A_Project\my-awesome-blog\backend
   ```

2. **Run the migration to create the weather table**
   ```bash
   alembic upgrade head
   ```

This command will:
- Apply all pending migrations (including revision 010 for the weather table)
- Create the `weather` table with all required columns and indexes
- Update the Alembic version table to track the migration

3. **Verify the table was created** (optional)
   - Check the database to confirm the `weather` table exists
   - The weather update service should now work without errors

## Expected Outcome
After running the migration, the weather update service will be able to:
- Query the weather table successfully
- Store weather data for cities (currently configured for "杭州")
- Update weather information on the scheduled hourly interval