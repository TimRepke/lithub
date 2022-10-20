import json
from collections import defaultdict
from typing import Literal, NamedTuple
from pathlib import Path
import numpy as np
import pyarrow as pa
from pyarrow import compute as pc, feather
import sqlite3
import logging

logging.basicConfig(format='%(asctime)s [%(levelname)s] %(name)s: %(message)s', level=logging.DEBUG)
logger = logging.getLogger('tyler')

MAX_OPEN_FILES: int = 25
n_open_files: int = 0

#  +----+----+
#  | 00 | 01 |
#  +----+----+
#  | 10 | 11 |
#  +----+----+
Quadrant = Literal['00', '01', '10', '11']
Axis = Literal['x', 'y']
Range = tuple[float, float]


class Midpoint(NamedTuple):
    pivot_x: float
    pivot_y: float


class Coordinates(NamedTuple):
    path: list[Quadrant]

    @property
    def depth(self) -> int:
        return len(self.path)

    @property
    def coord_0(self) -> int:
        return self._path_to_name(self.path[:-1])

    @property
    def coord_1(self) -> int:
        return self._path_to_name(self.path)

    @property
    def id(self) -> str:
        return f'{self.depth}/{self.coord_0}/{self.coord_1}'

    @staticmethod
    def _path_to_name(path) -> int:
        if len(path) > 0:
            return int(''.join(path), 2)
        return 0

    def __str__(self):
        return f'Coords(depth={self.depth}, {self.coord_0}, {self.coord_1})'

    def __repr__(self):
        return f'Coords(depth={self.depth}, {self.coord_0}, {self.coord_1}) at [{", ".join(self.path)}]'


class Extent(NamedTuple):
    # min and max value for each axis
    x: tuple[float, float]
    y: tuple[float, float]


def partition(table: pa.Table, axis: Axis, pivot: float) -> tuple[pa.Table, pa.Table]:
    # Divide a table along an axis at a midpoint (aka pivot)
    mask = pc.field(axis) < pivot
    return table.filter(mask), table.filter(~mask)


def sub_extents(extent: Extent, midpoint: Midpoint) -> dict[Quadrant, Extent]:
    return {
        '00': Extent(x=(extent.x[0], midpoint.pivot_x), y=(midpoint.pivot_y, extent.y[1])),
        '01': Extent(x=(midpoint.pivot_x, extent.x[1]), y=(midpoint.pivot_y, extent.y[1])),
        '10': Extent(x=(extent.x[0], midpoint.pivot_x), y=(extent.y[0], midpoint.pivot_y)),
        '11': Extent(x=(midpoint.pivot_x, extent.x[1]), y=(extent.y[0], midpoint.pivot_y))
    }


def extent_filter(extent: Extent) -> pc.Expression:
    return (pc.field('x') <= extent.x[1]) & (pc.field('x') >= extent.x[0]) & \
           (pc.field('y') <= extent.y[1]) & (pc.field('y') >= extent.y[0])


def compute_tile_size(table: pa.Table, extent: Extent) -> int:
    return table.filter(extent_filter(extent)).num_rows


class Tile:
    def __init__(self, sub_table: pa.Table, extent: Extent, coords: Coordinates,
                 max_tile_size: int, root_tile_size: int = None):
        self.extent = extent
        self.coords = coords
        self.max_tile_size = max_tile_size
        self.root_tile_size = root_tile_size

        self.midpoint = Midpoint(pivot_x=(extent.x[1] + extent.x[0]) / 2,
                                 pivot_y=(extent.y[1] + extent.y[0]) / 2)

        # associate data for this tile (not propagated to sub_tiles)
        self.tile_data_ixs, self.tile_data, remaining_data = self._sample_tile_data(sub_table)

        # split file further if it is bigger than requested
        self.sub_tiles: dict[Quadrant, Tile] = {}
        if remaining_data is not None:
            self._init_children(remaining_data)

    @property
    def depth(self) -> int:
        if len(self.sub_tiles) > 0:
            return 1 + max([st.depth for st in self.sub_tiles.values()])
        return 1

    @property
    def tile_size(self) -> int:
        return self.tile_data.num_rows

    @property
    def quadrant_size(self) -> int:
        return self.tile_size + sum([st.quadrant_size for st in self.sub_tiles.values()])

    def __str__(self):
        return f'Tile(size={self.tile_size}, depth={self.depth}, {str(self.coords)}, {self.extent})'

    def _init_children(self, remaining_data: pa.Table):
        child_extents = sub_extents(self.extent, self.midpoint)
        for quadrant, child_extent in child_extents.items():
            tile_size = compute_tile_size(remaining_data, child_extent)
            if tile_size > 0:
                child_coords = Coordinates(path=self.coords.path + [quadrant])
                child_tile = Tile(sub_table=remaining_data.filter(extent_filter(child_extent)),
                                  extent=child_extent, coords=child_coords,
                                  max_tile_size=self.max_tile_size)

                logger.debug(f'New tile in Q{quadrant}: {child_tile}')
                self.sub_tiles[quadrant] = child_tile

    def _sample_tile_data(self, sub_table: pa.Table) -> tuple[np.ndarray, pa.Table, pa.Table | None]:
        # nothing more to sample, return all remaining data
        if sub_table.num_rows <= self.max_tile_size:
            ixs = sub_table.column('ix').to_numpy()
            return ixs, sub_table, None

        # create random sample of integers (for offset-indexing)
        indices = np.random.randint(0, sub_table.num_rows, self.max_tile_size)
        # pick the data based in indices
        tile_data = sub_table.take(indices)
        # retrieve the associated IDs
        ixs = tile_data.column('ix').to_numpy()
        # create a filter that matches all rows but those with ix in IDs
        expression = ~pc.field('ix').isin(ixs)
        # apply filter
        remaining_data = sub_table.filter(expression)

        return ixs, tile_data, remaining_data

    def write_tile(self, base_path: Path, compression: Literal['zstd', 'lz4', 'uncompressed']):
        # resolves to sth like: path/to/tiles/1/3/5.feather
        target_file = (base_path / self.coords.id).with_suffix('.feather').resolve()
        target_file.parent.mkdir(parents=True, exist_ok=True)

        meta_data = {
            'extent': json.dumps({'x': self.extent.x, 'y': self.extent.y}),
            'children': json.dumps([st.coords.id for st in self.sub_tiles.values()]),
            'total_points': str(self.quadrant_size),
            'tile_size': str(self.tile_size)
        }
        # add metadata to schema
        schema = pa.schema(self.tile_data.schema, metadata=meta_data)
        frame = self.tile_data.cast(schema)

        # actually write the tile
        logger.debug(f'Writing tile to {target_file}')
        feather.write_feather(frame, str(target_file), compression=compression)

        # recurse downward
        for sub_tile in self.sub_tiles.values():
            sub_tile.write_tile(base_path=base_path, compression=compression)


def load_from_sqlite(db_file: Path, jitter: float = 0., batch_size: int = 250000) -> (pa.Table, Extent):
    con = sqlite3.connect(db_file)
    con.row_factory = sqlite3.Row
    con.set_trace_callback(logger.debug)
    cur = con.cursor()

    res = cur.execute('SELECT * FROM scheme')
    scheme = {
        r['scheme_id']: (r['label'], json.loads(r['choices']))
        for r in res
    }

    data_raw = {
        'ix': [],
        'title': [],
        'year': [],
        'x': [],
        'y': []
    }
    for label_id in scheme.keys():
        data_raw[f'label_{label_id}'] = []
    batch_i = 0
    while True:
        res = cur.execute("SELECT d.doc_id as ix, d.title, d.year, d.x, d.y, "
                          "       group_concat(l.label || ':' || l.choice, '|') annotations "
                          "FROM documents d "
                          "LEFT JOIN labels l on d.doc_id = l.doc_id "
                          "GROUP BY d.doc_id, d.title, d.year, d.x, d.y "
                          "LIMIT :limit OFFSET :offset;",
                          {'limit': batch_size, 'offset': batch_i * batch_size})
        res = res.fetchall()

        logger.debug(f'  > batch {batch_i} with {len(res):,} rows ...')

        # Pivot data from row format to column format
        for field in ['ix', 'title', 'year', 'x', 'y']:
            data_raw[field] += [row[field] for row in res]

        parsed = [dict([c.split(':')[:2] for c in row['annotations'].split('|')]) for row in res]
        for label_id in scheme.keys():
            data_raw[f'label_{label_id}'] += [int(row.get(str(label_id), -1)) for row in parsed]

        if len(res) < batch_size:
            break

        batch_i += 1

    data = {
        'ix': pa.array(data_raw['ix'], type=pa.uint64()),
        'title':  pa.array(data_raw['title'], type=pa.string()),
        'year': pa.array(data_raw['year'], type=pa.uint16()),
        'x': pa.array(data_raw['x'], type=pa.float32()),
        'y': pa.array(data_raw['y'], type=pa.float32())
    }
    for label_id in scheme.keys():
        data[f'label_{label_id}'] = pa.array(data_raw[f'label_{label_id}'], type=pa.int8())

    if jitter > 0:
        logger.debug(' -> Applying circular jitter to avoid overlapping points...')
        n_rows = data['x'].shape[0]
        rho = np.random.normal(0, jitter, n_rows)
        theta = np.random.uniform(0, 2 * np.pi, n_rows)
        data['x'] = pc.add(data['x'], pc.multiply(rho, pc.cos(theta)))
        data['y'] = pc.add(data['y'], pc.multiply(rho, pc.sin(theta)))

    logger.debug(' -> Computing extent...')
    extent = Extent(
        x=(pc.min(data['x']).as_py(), pc.max(data['x']).as_py()),
        y=(pc.min(data['y']).as_py(), pc.max(data['y']).as_py())
    )

    table = pa.table(list(data.values()), names=list(data.keys()))
    return table, extent


def run_tiling(
        # Path to sqlite file
        db_file: str | Path,
        # Directory to write tiles to
        output_dir: Path,
        # Rows from DB will be loaded in batches, this determines their size
        batch_size: int = 250000,

        # Number of records in first tile
        first_tile_size: int = 1000,
        # Number of records per tile
        tile_size: int = 50000,
        # Uniform random noise to add to points. If you have millions
        # of coincident points, can reduce the depth of the tree greatly.
        jitter: float = .0
):
    logger.info(f'Loading dataset from SQLite file "{db_file}"')
    table, extent = load_from_sqlite(db_file, jitter=jitter, batch_size=batch_size)
    logger.info(f'Extent: {extent}')

    logger.debug(f'Going to write tiles to: {output_dir}')

    root_tile = Tile(sub_table=table, extent=extent, coords=Coordinates(path=[]),
                     max_tile_size=tile_size, root_tile_size=tile_size)
    logger.info(f'Root tile: {root_tile}')

    root_tile.write_tile(output_dir, compression='uncompressed')


if __name__ == '__main__':
    run_tiling('../data/test1/data.sqlite',
               output_dir=Path('../data/test1/tiles'),
               batch_size=2000000, tile_size=100000)
