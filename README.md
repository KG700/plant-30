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
uvicorn main:app --reload --log-level debug 
```

### Deactivating virtual environment:
```
deactivate
```