import requests
import json

BASE_URL = "http://localhost:5000"
EMBEDDING_URL = "http://localhost:6000"

def test_health():
    print("\nTesting health endpoints...")
    try:
        # Test backend health
        response = requests.get(f"{BASE_URL}/health")
        print(f"Backend health: {response.status_code} - {response.json()}")
        
        # Test embedding service health
        response = requests.get(f"{EMBEDDING_URL}/health")
        print(f"Embedding service health: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health check failed: {str(e)}")

def test_create_task():
    print("\nTesting task creation...")
    task = {
        "title": "Test Task",
        "description": "This is a test task for API testing",
        "status": "todo"
    }
    try:
        response = requests.post(f"{BASE_URL}/tasks", json=task)
        print(f"Create task: {response.status_code}")
        if response.status_code == 201:
            print(f"Created task: {response.json()}")
            return response.json().get('id')
    except Exception as e:
        print(f"Create task failed: {str(e)}")
    return None

def test_get_tasks():
    print("\nTesting get all tasks...")
    try:
        response = requests.get(f"{BASE_URL}/tasks")
        print(f"Get tasks: {response.status_code}")
        if response.status_code == 200:
            tasks = response.json()
            print(f"Found {len(tasks)} tasks")
    except Exception as e:
        print(f"Get tasks failed: {str(e)}")

def test_search_tasks():
    print("\nTesting task search...")
    try:
        response = requests.get(f"{BASE_URL}/tasks/search?q=test")
        print(f"Search tasks: {response.status_code}")
        if response.status_code == 200:
            results = response.json()
            print(f"Found {len(results)} search results")
    except Exception as e:
        print(f"Search tasks failed: {str(e)}")

def test_delete_task(task_id):
    if not task_id:
        return
    print(f"\nTesting delete task {task_id}...")
    try:
        response = requests.delete(f"{BASE_URL}/tasks/{task_id}")
        print(f"Delete task: {response.status_code}")
    except Exception as e:
        print(f"Delete task failed: {str(e)}")

def main():
    print("Starting API tests...")
    test_health()
    task_id = test_create_task()
    test_get_tasks()
    test_search_tasks()
    test_delete_task(task_id)
    print("\nAPI tests completed!")

if __name__ == "__main__":
    main() 