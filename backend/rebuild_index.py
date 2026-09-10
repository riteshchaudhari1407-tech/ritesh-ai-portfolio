import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from services.rag_service import rag_service

if __name__ == "__main__":
    print("=== Force Rebuilding RAG Vector Index ===")
    rag_service.initialize_index(force_rebuild=True)
    print("=== RAG Vector Index Rebuild Complete ===")
