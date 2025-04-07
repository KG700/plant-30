## Plant 30


## Getting started

### Setting up the virtual environment:
```
python3 -m venv .venv
source .venv/bin/activate
```

### Installing dependencies
```
pip install -r requirements.txt
```

### Running server
```
uvicorn src.main:app --reload --log-level debug
```

### Deactivating virtual environment:
```
deactivate
```
### Running backend unit tests
```
cd backend
pytest --asyncio-mode=auto
```
