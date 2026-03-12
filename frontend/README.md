```bash
# from frontend dir
uv run --extra server hypercorn main:app --config=/data/lithub/literature-hub/.config/server.toml

# from project root
rsync -avh --progress -e ssh .data se164:/data/lithub
```