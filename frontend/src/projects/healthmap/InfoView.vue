<script setup lang="ts"></script>

<template>
  <h3>Mapping climate & health evidence</h3>
  <p class="fst-italic">
    <strong>Authors:</strong>
    Max Callaghan, et al.
  </p>
  <p>
    The climate and health interactive platform allows users to explore the data generated in a machine-learning
    assisted rapid map of the evidence on climate and health, conducted by the University of Leeds, the London School of
    Hygiene and Tropical Medicine, and the Mercator Research on Global Commons and Climate Change in Berlin. The
    evidence map was produced for the UK Department for International Development.
  </p>
  <p>
    The map coded 15,000 scientific papers by subject (using topic modelling) and by place of study (using a geoparser).
    The interactive platform allows users to explore this data.
  </p>
  <h2>Regional exploration</h2>
  <p>
    The regions section displays 6 geographical regions with countries that are of special interest to DfID. In each
    country, we place a dot in the location of all studies for which we found a location in that country. The bar chart
    to the right of the map describes the topics which are highly prevalent (compared to the global average) in the
    region. The sidebar on the right shows the documents and topics that are currently selected. By default this will
    show all documents in the countries of interest to DfID.
  </p>
  <h2>Climate-health pathways</h2>
  <p>
    This "heatmap" shows the number of documents in various combinations of topic category. The columns refer to groups
    of topics which describe climate drivers, while the rows refer to groups of topics which describe health impacts.
    Each cell contains the number of documents which have high topic scores for the climate driver in the column and the
    health impact in the row.
  </p>
  <p>
    Darker colours refer to higher numbers, but we may also want to highlight large and small values in the context of
    each row or each column. Clicking on "Normalise by column sum" adjusts the colour scale so that the colours reflect
    each cell's proportion of the column sum, and "Normalise by row sum" does the same for the row sum.
  </p>
  <p>
    Clicking on a cell updates the table on the right side of the screen to show the documents which refer to topics in
    the cells column and row. For example, the screenshot below shows the documents relevant to Infections disease &
    Temperature
  </p>
</template>

<style scoped></style>
