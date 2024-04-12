# Dataset folder

It's configurable where this folder lives, but we use this place to describe how to set up a dataset.

* All data lives in the `abstracts` table of the respective sqlite file
* IDs shall be consecutive integers starting at 0
* Folders starting with `.` will be ignored

```sql
CREATE TABLE documents
(
    idx              BIGINT PRIMARY KEY, -- consecutive (NO GAPS!) index starting at 0
    -- x,y position for this document (normalised to 0-1)
    x                FLOAT NOT NULL,
    y                FLOAT NOT NULL,

    title            TEXT,               -- title of the paper
    abstract         TEXT,               -- abstract of the paper
    publication_year INTEGER,            -- year published

    openalex_id      TEXT,               -- (optional) OpenAlex ID
    nacsos_id        TEXT,               -- (optional) ID used in NACSOS
    doi              TEXT,               -- (optional) DOI; excluding https://doi.org/

    authors          TEXT,               -- properly (clean and uniformly) formatted author list (e.g.: "John Smith, Lisa Roberts, et al.")
    institutions     TEXT                --  
);
```

## Add value keys to scheme

```python
import toml

o = toml.load('.data/path/to/info.toml')
for k, v in o['scheme'].items():
    for vi in v['values']:
        vi['key'] = f'{k}|{int(vi["value"])}'
toml.dump(o, open('.data/path/to/info.toml', 'w'))
```

## Fixing DOI

Forgot to drop the https prefix from DOIs? Run this:

```sql
UPDATE documents
SET doi = substr(doi, 17);
```

## Setting up FTS

```sql
-- in case you have one already
DROP TABLE search;

-- Set up search on title, text, authors
CREATE VIRTUAL TABLE search USING fts5
(
    idx,
    title,
    abstract,
    authors
);
-- Indexing data
INSERT INTO search (idx, title, abstract, authors)
SELECT idx, title, abstract, authors
FROM documents;

-- example query
SELECT idx, highlight(search, 2, '<b>', '</b>')
FROM search('calif* AND low');
```

## Colour scheme tips:

# https://colorkit.co/palettes/8-colors/

# https://colordesigner.io/convert/hextohsl
