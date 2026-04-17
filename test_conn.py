import psycopg2
import sys
import os

DB_HOST = "db.fptmfurazlkkldvxdflm.supabase.co"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "wUYa4M4Sp6OSwffV"
DB_PORT = "5432"

try:
    print("Conectando a Supabase...")
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    record = cursor.fetchone()
    print(f"✅ Conexión exitosa. Versión: {record[0]}")
    
    # Vamos a crear el schema automáticamente
    schema_path = os.path.join(os.path.dirname(__file__), "supabase", "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()
    
    print("🔄 Ejecutando schema.sql...")
    cursor.execute(sql)
    print("✅ Base de datos estructurada con éxito.")
    
    cursor.close()
    conn.close()

except Exception as e:
    print(f"❌ Error al conectar: {e}")
    sys.exit(1)
