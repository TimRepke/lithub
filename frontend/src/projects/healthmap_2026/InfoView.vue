<script setup lang="ts"></script>

<template>
  <h3>Mapping climate & health evidence</h3>
  <!-- <p class="fst-italic">
    <strong>Authors:</strong>
    Max Callaghan, et al.
  </p> -->
  <p>
    The climate and health interactive platform provides access to a living map of the literature on climate and health,
    produced using machine learning as part of the
    <a href="https://www.lshtm.ac.uk/research/centres-projects-groups/pathfinder-initiative">PATHFINDER initiative</a>.
    A detailed user guide is available at <a>LINK</a>.
  </p>
  <p>
    This map builds on foundations laid by
    <a href="https://doi.org/10.1016/S2542-5196(21)00179-0">
      Systematic mapping of global research on climate and health: a machine learning review </a
    >, published in Lancet Planetary Health and led by Lea Berrang-Ford .
  </p>
  <p>
    In addition to the topic models developed Berrand Ford et al, this map uses transformer-based models to further
    categorise the literature.
  </p>
  <p>
    Labels from topic models and transformer-based models can be used and combined as filters (on the left-hand panel)
    to help explore the literature and identify subsets of the literature of relevance to your research question. In
    addition, data can be filtered according to locations mentioned in a study, or by the location of authors'
    affiliations (note that not all documents mention a location).
  </p>
  <h3>Visualisations and exploration</h3>
  <p>In addition to the filters, data can be explored, and further selected using the visualisations detailed below</p>
  <h4>Scatterplot</h4>
  <p>
    The scatterplot plots documents in a 2-dimensional representation of the topic space. Documents with similar topics
    are placed close together, and areads of the map can be selected by holding SHIFT and dragging the mouse.
  </p>
  <h4>Geographic map</h4>
  The geographic map displays research that matches your filter on a geographic map. Select countries to view research
  on climate and health from that country.
  <h4>Cross-tab</h4>
  <p>
    The cross-tab shows displays the distribution of research on the intersection of different sets of filters. Click on
    any of the cells to narrow your selection to papers which address the combination of row and column headings.
  </p>
</template>

<style scoped></style>
