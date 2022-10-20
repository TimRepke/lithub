# NACSOS-services TopicExplorer

## Building/starting the server

```bash
# Install python dependencies
virtualenv venv
source venv/bin/activate
pip install -r server/requirements.txt

# Install frontend dependencies
cd frontend
npm install

# Build frontend
npm run api # (only if backend was changed)
npm run build

# Start server
export PYTHONUNBUFFERED=1 # optional
export PYTHONASYNCIODEBUG=1 # optional
export NACSOS_TE_CONFIG=config/default.env
hypercorn server.app:app --config=config/hypercorn.toml
```

## Topic Model Format

The topic model explorer assumes the following format for pre-computed topic models.
Each model is a folder in the `/data` folder containing the following files:

* `info.toml`: Basic settings and information about this model
* `data.sqlite`: SQLite database file with the data
* `tiles/`: Folder containing Arrow files (will be generated on first use of the dataset)
* `pages/`: Folder containing md files that will be rendered

### Model info

```toml
[info]
name = "??"
# if not empty, user needs to provde the token to see the model
access_token = ""

[db]
# where to look for data ("generic" or "twitter")
data = "generic"
# the available topic similarity measures
similarities = ["hd-cos"]
# set to false if topic annotations don't exist yet
annotations = false
```

### Pages

This can be used to build (interactive) websites written in markdown.
Each markdown file in the folder will be rendered as an entry in the navigation.
Paths to attachments/figures are assumed to be relative to this folder.

### SQLite database

The database should contain the following tables:

* ?data? (base for `generic` or `tweets`)
    * id [int]
    * nacsos_id [str | NULL]
    * txt [str]
    * topic [int | NULL]: FK to `id` in `topics`
    * meta_topic [int | NULL]: FK to `id` in `meta_topics`
    * created [str | NULL]: formatted like '2018-01-01T00:00:16.000Z'
    * x [float]
    * y [float]
* generic (implements ?data?)
    * see above in ?data?
    * meta [str]: JSON-formatted string with meta-data
* tweets (implements ?data?)
    * see above in ?data?
    * retweets [int]
    * likes [int]
    * replies [int]
* topics _(may also be labels)_
    * id [int]
    * name [str | NULL]: manually assigned topic name _(optional)_
    * terms_tfidf [str | NULL]: e.g. comma-separated list of tokens _(optional)_
    * terms_mmr [str | NULL]: e.g. comma-separated list of tokens _(optional)_
* meta_topics *(optional)*
    * id [int]
    * name [name]
    * description [str | NULL]
* similarities (for simplicity we assume asymmetric similarity measure, so there should always be two rows per pair and
  metric) _[optional]_
    * topic_a [int]: FK to `id` in `topics`
    * topic_b [int]: FK to `id` in `topics`
    * metric [str]: e.g. 'hd-cos' (cosine similarity in embedding space) or 'ld-euclid' (euclidean distance in 2D
      projection)
    * similarity [float]: similarity score between the two topics

## Design systems

* https://atlassian.design/
* https://carbondesignsystem.com/
* https://www.lightningdesignsystem.com/