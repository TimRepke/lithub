CREATE TABLE documents (
    doc_id     INTEGER PRIMARY KEY AUTOINCREMENT, -- integer ID
    nacsos_id  TEXT,             -- (optional) ID used in NACSOS
    doi        TEXT,             -- (optional) DOI
    title      TEXT NOT NULL,    -- title of the paper
    abstract   TEXT,             -- abstract of the paper
    year       INTEGER,          -- year published
    authors    TEXT,             -- properly (clean and uniformly) formatted author list (e.g.: "John Smith, Lisa Roberts, et al.")

    -- x,y position for this document (no normalisation necessary)
    x          FLOAT NOT NULL,
    y          FLOAT NOT NULL
);
-- virtual full-text-search index on title and abstract
CREATE VIRTUAL TABLE documents_fts USING fts5(title, abstract, content=documents, content_rowid=doc_id);


-- Summary of annotation scheme, so we can directly refer to it in the interface
-- Concept similar (but simplified, no recursion, only kind=single) to NACSOS
-- https://gitlab.pik-potsdam.de/mcc-apsis/nacsos/nacsos-data/-/blob/master/src/nacsos_data/models/annotations.py
-- Each label has multiple values/choices/expressions it could take, e.g.
--      Label "Technology Type" could be ["Biochar", "BECCS", "Enhanced Weathering", ...]
CREATE TABLE scheme (
    scheme_id   INTEGER PRIMARY KEY AUTOINCREMENT, -- integer ID
    label       TEXT NOT NULL,  -- name for this label
    choices     TEXT NOT NULL,  -- JSON formatted list of strings of valid label choices
    description TEXT            -- (optional) brief teaser/description for this label
);

-- many-to-many table for document annotations
CREATE TABLE labels (
    label_id   INTEGER PRIMARY KEY AUTOINCREMENT, -- integer ID
    doc_id     INTEGER NOT NULL, -- reference to document
    label      INTEGER NOT NULL, -- label (see scheme)
    choice     INTEGER NOT NULL, -- choice (index in scheme.choices, starts at zero)
    confidence FLOAT,            -- (optional) confidence provided by model

    FOREIGN KEY (doc_id) REFERENCES documents (doc_id),
    FOREIGN KEY (label) REFERENCES scheme (scheme_id)
);