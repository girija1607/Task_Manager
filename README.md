# Task Manager with Semantic Search

A modern task management application with semantic search capabilities, built using a microservices architecture.

## Features

- Create, view, and delete tasks
- Semantic search using vector embeddings
- Modern, responsive UI
- Microservices architecture
- Docker containerization

## Tech Stack

- Frontend: React.js
- Backend: Node.js/Express
- Database: PostgreSQL with pgvector
- Embedding Service: Python/Flask with Sentence Transformers
- Containerization: Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Python 3.10+ (for local development)

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password_here
   POSTGRES_DB=tasksdb
   POSTGRES_HOST=postgres-vector
   POSTGRES_PORT=5432
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Embedding Service: http://localhost:6000

## API Endpoints

- `GET /tasks` - Get all tasks
- `POST /tasks` - Create a new task
- `DELETE /tasks/:id` - Delete a task
- `GET /tasks/search?q=<query>` - Search tasks semantically

## Development

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Embedding Service
```bash
cd embedding-service
pip install -r requirements.txt
python app.py
```

## Testing

Run the API tests:
```bash
python test_api.py
```

## License

MIT 