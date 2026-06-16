<script setup lang="ts">
import guide from "@/assets/cdr_coding_guide.pdf";
</script>

<template>
  <div class="container ms-1 mt-4">
    <h3>Map of literature on carbon dioxide removal</h3>
    <p>
      This website provides a systematic map of the scientific literature on Carbon Dioxide Removal (CDR). Since its
      first version published in Nature Communications, the map was updated to include newly published research as part
      of the State of Carbon Dioxide Removal.
    </p>

    <p>
      Carbon dioxide removal plays an important role in any strategy to limit global warming to well below 2°C. Keeping
      abreast with the scientific evidence using rigorous evidence synthesis methods is an important prerequisite for
      sustainably scaling these methods. Scientific publications provide observable, standardized and comparable
      evidence of knowledge production. Analysing the scientific publication landscape on CDR gives a bird's eye view of
      how research activities evolve over time and are distributed across the globe, as well as the extent to which they
      support development of individual CDR methods. Publications are also public goods that are accessible to other
      researchers. Citation counts reveal how knowledge flows through research systems, reflecting the broader impact of
      R&D investments and capturing knowledge spillovers.
    </p>

    <p class="fst-italic">
      <strong>Authors:</strong> Sarah Lück, Tim Repke, Finn Müller-Hansen<br />
      <strong>Collaborators:</strong>
      Christiane Hamann, Leon Stephan, Max Callaghan, Malgorzata Borchers, Annette Cowie, Sabine Fuss, Matthew Gidden,
      Jens Hartmann, Claudia Kammann, David P. Keller, Florian Kraxner, William Lamb, Niall Mac Dowell, Gregory Nemet,
      Benedict Probst, Phil Renforth, Wilfried Rickels, Ingrid Schulte, Pete Smith, Stephen M Smith, Daniela Thrän,
      Tiffany G. Troxler, Volker Sick, Mijndert van der Spek, Jan C. Minx
    </p>

    <h5>Citations</h5>
    <ul>
      <li>
        <i
          >Diaz Anadon, L., Minx, J. C., Bültemann, M., Gruner, F., Müller-Hansen, F., Pflugbeil, L., Reeves, D. C.,
          Repke, T.</i
        ><br />
        Chapter 2: Research and development, <br />in The State of Carbon Dioxide Removal (3rd Edition, 2026).
        <a href="https://doi.org/10.17605/OSF.IO/9G5YW" target="_blank">doi:10.17605/OSF.IO/9G5YW</a>
      </li>
      <li>
        <i
          >Minx, J. C., Probst, B. S., Lück, S., Müller-Hansen, F., Toetzke, M., Diaz Anadon, L., Engelmann, T., Greene,
          J., Hoffmann, V. H., Nemet, G. F., Repke, T.</i
        ><br />
        Chapter 2: Research and development,<br />
        in The State of Carbon Dioxide Removal (2nd Edition, 2024).
        <a href="https://doi.org/10.17605/OSF.IO/4FGHP" target="_blank">doi:10.17605/OSF.IO/4FGHP</a>
      </li>
      <li>
        <i>Minx, J. C., Lück, S., Callaghan, M., Fuss, S.</i> <br />Chapter 2: Research landscape,<br />
        in The State of Carbon Dioxide Removal (1st Edition, 2023).
        <a href="https://doi.org/10.17605/OSF.IO/W3B4Z" target="_blank">doi:10.17605/OSF.IO/W3B4Z</a>
      </li>
      <li>
        <i>Sarah Lück, et al.</i><br />
        Scientific literature on carbon dioxide removal revealed as much larger through AI-enhanced systematic
        mapping.<br />
        Nature Communications 16, 6632 (2025).
        <a href="https://www.nature.com/articles/s41467-025-61485-8" target="_blank">
          doi:10.1038/s41467-025-61485-8
        </a>
      </li>
      <li>
        <i>Tim Repke</i><br />
        Interactive platform for the exploration of large-scale ‘living’ systematic maps. <br />In
        <i>Proceedings of the 2nd Workshop on Natural Language Processing Meets Climate Change (ClimateNLP 2025)</i>,
        pages 260–265, Vienna, Austria. Association for Computational Linguistics.
        <a href="https://aclanthology.org/2025.climatenlp-1.18/">doi:10.18653/v1/2025.climatenlp-1.18</a>
      </li>
    </ul>

    <h5>Data and Methods</h5>
    <p>
      We use an approach assisted by machine learning to provide a comprehensive evidence map of CDR research. We follow
      well established guidelines for systematic mapping (Collaboration for Environmental Evidence 2018) and adjusted
      them as needed. We document all steps in a detailed
      <a :href="guide" target="_blank">systematic map protocol</a>&nbsp;
      <a href="https://doi.org/10.17504/protocols.io.e6nvwqwqwvmk/v1" target="_blank">[doi]</a>
      for transparency and reproducibility.
    </p>

    <h5>Data sources and search queries</h5>
    <p>
      Publications are retrieved through targeted queries of different scientific literature databases covering all CDR
      approaches represented in the map. Depending on the version of the map, we use records from different combinations
      of the following databases: <a href="https://www.webofscience.com/" target="_blank">Web of Science</a>,
      <a href="https://www.scopus.com/" target="_blank">Scopus</a>,
      <a href="https://www.dimensions.ai/" target="_blank">Dimensions</a>, and
      <a href="https://openalex.org/" target="_blank">OpenAlex</a>. For each CDR method, we developed high-recall search
      queries. For some methods, such as afforestation, we included keywords to narrow the topical focus on carbon
      sequestration. The development of search strings was done iteratively by validating against an independent list of
      publications on the various CDR methods ensuring that all documents are returned. The validation dataset was
      extracted from IPCC AR6 and 50 randomly selected publications from the
      <a href="https://www.american.edu/sis/centers/carbon-removal/carbon-removal-glossary.cfm" target="_blank">
        CDR bibliography
      </a>
      published by the Climate Protection and Restoration Initiative. The search queries are defines in the
      <a
        href="https://gitlab.pik-potsdam.de/mcc-apsis/living-evidence-maps/cdr-map/living-cdr-map/-/tree/main/S01_Retrieve?ref_type=heads"
        target="_blank"
        >GitLab repository</a
      >.
    </p>

    <h5>Geoparsing</h5>
    <p>
      We use <a href="https://github.com/ahalterman/mordecai3" target="_blank">mordecai3</a> to extract mentions of
      geographic locations from the title/abstract. Based on the country code, the extracted locations are matched to
      various groupings and regions following definitions by the UN, IPCC, and the Lancet Countdown.
    </p>

    <h5>Classification</h5>
    <p>
      We developed machine-learning classifiers to identify relevant literature and further categorise records. To do
      so, we manually coded a total of 5,339 abstracts (100-600 per CDR method) for inclusion according to our
      <a href="https://doi.org/10.17504/protocols.io.e6nvwqwqwvmk/v1" target="_blank">codebook</a>. To ensure quality,
      each document is screened and annotated by two coders. For each label (treated as binary classification), we train
      a wide range of models and tune hyper-parameters on multiple folds. The best setting is then 10-fold
      cross-validated (see table for results). Some initially coded categories were excluded due to insufficient
      classification quality. In a later update, we expanded the scope to new CDR methods: direct ocean capture, biomass
      sinking, biomass burial, mineral products, bio-oil storage, and wood products. For these, we followed a different
      approach using a large language model (GPT 5.2 via the batch API). We evaluated the approach by manually labelling
      a validation dataset of 100 abstracts from each of the six queries and compared manually and LLM-generated labels
      to find a good enough performance. To reduce the rate of false positives, we only included records that were
      retrieved with the search query for the respective CDR method. The relevance classification for results from these
      prompts is also using this LLM approach.
    </p>

    <table class="table">
      <thead>
        <tr>
          <th>Label</th>
          <th>Name <code class="small">[export column]</code> <span class="text-muted">(Annotation counts)</span></th>
          <th>Model</th>
          <th>Precision</th>
          <th>Recall</th>
          <th>F1</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Inclusion</td>
          <td>
            Relevant <code class="small">[relevance|1]</code> <br /><span class="text-muted"
              >(yes=3,968, no=4,161)</span
            >
          </td>
          <td>CLIMATEBERT</td>
          <td>89%</td>
          <td>94%</td>
          <td>91%</td>
        </tr>
        <tr>
          <td rowspan="3">Assessment type</td>
          <td>
            Side effects (environmental) <code class="small">[assessment|1]</code> <br /><span class="text-muted"
              >(yes=530, no=2,402)</span
            >
          </td>
          <td>CLIMATEBERT</td>
          <td>84%</td>
          <td>90%</td>
          <td>87%</td>
        </tr>
        <tr>
          <td>
            Economic considerations <code class="small">[assessment|2]</code> <br /><span class="text-muted"
              >(yes=280, no=2,654)</span
            >
          </td>
          <td>SCIBERT</td>
          <td>80%</td>
          <td>95%</td>
          <td>92%</td>
        </tr>
        <tr>
          <td>
            Storage potentials <code class="small">[assessment|3]</code> <br /><span class="text-muted"
              >(yes=1,005, no=1,926)</span
            >
          </td>
          <td>CLIMATEBERT</td>
          <td>88%</td>
          <td>93%</td>
          <td>90%</td>
        </tr>
        <tr>
          <td rowspan="4">Research context</td>
          <td>
            Public perception <code class="small">[context|1]</code> <br /><span class="text-muted"
              >(yes=42, no=2,893)</span
            >
          </td>
          <td>SCIBERT</td>
          <td>75%</td>
          <td>100%</td>
          <td>86%</td>
        </tr>
        <tr>
          <td>
            Governance <code class="small">[context|3]</code> <br /><span class="text-muted">(yes=101, no=2,833)</span>
          </td>
          <td>CLIMATEBERT</td>
          <td>59%</td>
          <td>67%</td>
          <td>63%</td>
        </tr>
        <tr>
          <td>
            Socio-economic pathways <code class="small">[context|4]</code> <br /><span class="text-muted"
              >(yes=309, no=2,624)</span
            >
          </td>
          <td>TINYBERT</td>
          <td>61%</td>
          <td>65%</td>
          <td>63%</td>
        </tr>
        <tr>
          <td>
            Technology-focus <code class="small">[context|5]</code> <br /><span class="text-muted"
              >(yes=2,514, no=420)</span
            >
          </td>
          <td>CLIMATEBERT</td>
          <td>97%</td>
          <td>97%</td>
          <td>97%</td>
        </tr>
        <tr>
          <td rowspan="7">Scientific method</td>
          <td>
            Experimental (field-study) <code class="small">[method|0]</code> <br /><span class="text-muted"
              >(yes=637, no=4,665)</span
            >
          </td>
          <td>SCIBERT</td>
          <td>91%</td>
          <td>86%</td>
          <td>88%</td>
        </tr>
        <tr>
          <td>
            Experimental (laboratory) <code class="small">[method|1]</code> <br /><span class="text-muted"
              >(yes=1,218, no=4,110)</span
            >
          </td>
          <td>SCIBERT</td>
          <td>92%</td>
          <td>93%</td>
          <td>93%</td>
        </tr>
        <tr>
          <td>
            Modelling <code class="small">[method|2]</code> <br /><span class="text-muted">(yes=714, no=4,599)</span>
          </td>
          <td>CLIMATEBERT</td>
          <td>84%</td>
          <td>94%</td>
          <td>89%</td>
        </tr>
        <tr>
          <td>
            Life cycle assessment <code class="small">[method|4]</code> <br /><span class="text-muted"
              >(yes=71, no=5,267)</span
            >
          </td>
          <td>CLIMATEBERT</td>
          <td>828%</td>
          <td>90%</td>
          <td>86%</td>
        </tr>
        <tr>
          <td>
            Review <code class="small">[method|5]</code> <br /><span class="text-muted">(yes=670, no=4,649)</span>
          </td>
          <td>SCIBERT</td>
          <td>87%</td>
          <td>73%</td>
          <td>79%</td>
        </tr>
        <tr>
          <td>Survey <code class="small">[method|7]</code> <br /><span class="text-muted">(yes=32, no=5,306)</span></td>
          <td>SCIBERT</td>
          <td>75%</td>
          <td>60%</td>
          <td>67%</td>
        </tr>
        <tr>
          <td>
            Qualitative <code class="small">[method|8]</code> <br /><span class="text-muted">(yes=80, no=5,246)</span>
          </td>
          <td>SCIBERT</td>
          <td>70%</td>
          <td>58%</td>
          <td>64%</td>
        </tr>
        <tr>
          <td rowspan="17">CDR Method</td>
          <td>
            Blue carbon <code class="small">[technology|0]</code> <br /><span class="text-muted"
              >(yes=343, no=4,954)</span
            >
          </td>
          <td>CLIMATEBERT</td>
          <td>98%</td>
          <td>100%</td>
          <td>99%</td>
        </tr>
        <tr>
          <td>
            BECCS <code class="small">[technology|5]</code> <code class="small">[technology|3]</code> <br /><span
              class="text-muted"
              >(yes=331, no=4,998)</span
            >
          </td>
          <td>CLIMATEBERT</td>
          <td>90%</td>
          <td>92%</td>
          <td>91%</td>
        </tr>
        <tr>
          <td>
            Biochar <code class="small">[technology|4]</code> <br /><span class="text-muted">(yes=613, no=4,725)</span>
          </td>
          <td>TINYBERT</td>
          <td>98%</td>
          <td>100%</td>
          <td>99%</td>
        </tr>
        <tr>
          <td>
            CCS <code class="small">[technology|5]</code> <br /><span class="text-muted">(yes=1,242, no=4,076)</span>
          </td>
          <td>SCIBERT</td>
          <td>92%</td>
          <td>91%</td>
          <td>91%</td>
        </tr>
        <tr>
          <td>
            CCUs <code class="small">[technology|6]</code> <br /><span class="text-muted">(yes=163, no=5,168)</span>
          </td>
          <td>CLIMATEBERT</td>
          <td>72%</td>
          <td>75%</td>
          <td>74%</td>
        </tr>
        <tr>
          <td>
            DAC(CS) <code class="small">[technology|7]</code> <br /><span class="text-muted">(yes=234, no=5,103)</span>
          </td>
          <td>SCIBERT</td>
          <td>83%</td>
          <td>97%</td>
          <td>89%</td>
        </tr>
        <tr>
          <td>
            Enhanced weathering (land-based) <code class="small">[technology|8]</code> <br /><span class="text-muted"
              >(yes=164, no=5,175)</span
            >
          </td>
          <td>SCIBERT</td>
          <td>74%</td>
          <td>96%</td>
          <td>84%</td>
        </tr>
        <tr>
          <td>
            Ocean fertilization or artificial upwelling <code class="small">[technology|11]</code> <br /><span
              class="text-muted"
              >(yes=92, no=5,247)</span
            >
          </td>
          <td>CLIMATEBERT</td>
          <td>100%</td>
          <td>93%</td>
          <td>96%</td>
        </tr>
        <tr>
          <td>
            Soil carbon sequestration <code class="small">[technology|13]</code> <br /><span class="text-muted"
              >(yes=465, no=4,849)</span
            >
          </td>
          <td>SCIBERT</td>
          <td>82%</td>
          <td>82%</td>
          <td>82%</td>
        </tr>
        <tr>
          <td>
            Peatland restoration <code class="small">[technology|14]</code> <br /><span class="text-muted"
              >(yes=163, no=5,172)</span
            >
          </td>
          <td>SCIBERT</td>
          <td>96%</td>
          <td>88%</td>
          <td>91%</td>
        </tr>
        <tr>
          <td>
            Algae farming <code class="small">[technology|15]</code> <br /><span class="text-muted"
              >(yes=94, no=5,234)</span
            >
          </td>
          <td>TINYBERT</td>
          <td>100%</td>
          <td>93%</td>
          <td>96%</td>
        </tr>
        <tr>
          <td>
            General CDR literature <code class="small">[technology|16]</code> <br /><span class="text-muted"
              >(yes=105, no=5,233)</span
            >
          </td>
          <td>CLIMATEBERT</td>
          <td>100%</td>
          <td>50%</td>
          <td>67%</td>
        </tr>
        <tr>
          <td>Forest-based CDR <br /><span class="text-muted">(yes=230, no=5,239)</span></td>
          <td>SCIBERT</td>
          <td>72%</td>
          <td>94%</td>
          <td>82%</td>
        </tr>
        <tr>
          <td>
            Ocean alkalinity enhancement (extended) <code class="small">[technology|18]</code> <br /><span
              class="text-muted"
              >(yes=467, no=7,745)</span
            >
          </td>
          <td>SCIBERT</td>
          <td>75%</td>
          <td>93%</td>
          <td>83%</td>
        </tr>
        <tr>
          <td>Harvested wood products <code class="small">[technology|19]</code></td>
          <td>LLM</td>
          <td>--</td>
          <td>--</td>
          <td>--</td>
        </tr>
        <tr>
          <td>Mineral products <code class="small">[technology|20]</code></td>
          <td>LLM</td>
          <td>--</td>
          <td>--</td>
          <td>--</td>
        </tr>
        <tr>
          <td>Bio-oil storage <code class="small">[technology|21]</code></td>
          <td>LLM</td>
          <td>--</td>
          <td>--</td>
          <td>--</td>
        </tr>
      </tbody>
    </table>
    <p>Discontinued labels that previously existed due to changed definitions or low classifier quality (F1<0.6):</p>
    <ul>
      <li>Not including column "Unknown method"</li>
      <li>Not including column "Afforestation or reforestation" (old annotations)</li>
      <li>Not including column "Agroforestry"</li>
      <li>Not including column "Systematic review"</li>
      <li>Not including column "Statistical analysis"</li>
      <li>Not including column "Side effects (non-environmental)"</li>
      <li>Not including column "Other technology"</li>
      <li>Not including column "Ocean alkalinity enhancement" (old annotations)</li>
      <li>Not including column "Equity & ethics"</li>
      <li>Not including column "Earth system"</li>
    </ul>
  </div>
</template>

<style scoped></style>
