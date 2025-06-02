from sentence_transformers import SentenceTransformer
import psycopg2

model = SentenceTransformer('all-MiniLM-L6-v2')

conn = psycopg2.connect(
    dbname="tasksdb",
    user="postgres",
    password="your_password_here",
    host="localhost",
    port="5432"
)
cur = conn.cursor()

query = "shopping groceries"
query_embedding = model.encode(query).tolist()

embedding_str = '[' + ','.join(str(x) for x in query_embedding) + ']'

sql = """
SELECT id, title, description, status
FROM tasks
ORDER BY embedding <-> %s::vector
LIMIT 3;
"""

cur.execute(sql, (embedding_str,))
results = cur.fetchall()

print("Top 3 similar tasks:")
for r in results:
    print(f"ID: {r[0]}, Title: {r[1]}, Description: {r[2]}, Status: {r[3]}")

cur.close()
conn.close()


