<script setup lang="ts">
import guide from "@/assets/cdr_coding_guide.pdf";
</script>

<template>
  <div class="container ms-1 mt-4">
    <h3>Map of literature on carbon dioxide removal</h3>
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
        <i>Sarah Lück, et al.</i>
        Scientific literature on carbon dioxide removal revealed as much larger through AI-enhanced systematic mapping.
        Nat Commun 16, 6632 (2025).
        <a href="https://www.nature.com/articles/s41467-025-61485-8" target="_blank">
          https://doi.org/10.1038/s41467-025-61485-8
        </a>
      </li>
      <li>SoCDR v1, chapter ?</li>
      <li>SoCDR v2, chapter ?</li>
      <li>SoCDR v3, chapter ?</li>
    </ul>

    <h5>Abstract</h5>
    <p>
      Carbon dioxide removal plays an important role in any strategy to limit global warming to well below 2°C. Keeping
      abreast with the scientific evidence using rigorous evidence synthesis methods is an important prerequisite for
      sustainably scaling these methods. Here, we use artificial intelligence to provide a comprehensive systematic map
      of carbon dioxide removal research. We find a total of 28,976 studies on carbon dioxide removal—3–4 times more
      than previously suggested. Growth in research is faster than for the field of climate change research as a whole,
      but very concentrated in specific areas—such as biochar, certain research methods like lab and field experiments,
      and particular regions like China. Patterns of carbon dioxide removal research contrast with trends in patenting
      and deployment, highlighting the differing development stages of these technologies. As carbon dioxide removal
      gains importance for the Paris climate goals, our systematic map can support rigorous evidence synthesis for the
      IPCC and other assessments.
    </p>

    <h5>Data and Methods</h5>
    <p>
      We use an approach assisted by machine learning to provide the first comprehensive evidence map of CDR research.
      We follow the well established guidelines for systematic mapping (Collaboration for Environmental Evidence 2018),
      wherever possible, and adjust them as needed to align with our machine learning approach. We document all steps in
      a detailed
      <a :href="guide" target="_blank"> systematic map protocol </a>
      for transparency and reproducibility.
    </p>

    <p>
      We started by developing, for each CDR method, search strings with high levels of recall to make sure that as few
      scientific articles are missed as possible. The search strings include keywords describing the CDR technology. For
      long established methods such as afforestation we included keywords that make sure the method is evaluated with a
      focus on carbon sequestration. The development of search strings was done iteratively by validating against an
      independent list of publications on the various CDR methods ensuring that all documents are returned. The
      validation dataset was extracted from IPCC AR6 and 50 randomly selected publications from the
      <a href="https://www.american.edu/sis/centers/carbon-removal/carbon-removal-glossary.cfm" target="_blank">
        CDR bibliography
      </a>
      published by the Climate Protection and Restoration Initiative. We then ran the final search strings on Open Alex
      and retrieved 100,000 bibliographic records.
    </p>
    <p>
      In the next step we work towards precision by developing a machine-learning classifier to distinguish relevant,
      namely all studies on negative emissions and CDR, from irrelevant scientific studies in our query. We manually
      screen and annotate a total of 5,339 documents (100-600 per CDR method) for inclusion according to our codebook.
      To ensure reproducibility, each document is screened and annotated by two coders as recommended by the relevant
      guidelines (Collaboration for Environmental Evidence 2018). We use our annotations to train and validate binary
      classifiers to predict inclusion, using the title and abstract of the documents as inputs. The best performing
      classifier (F1: 0.91; ROC-AUC: 0.85) is derived from ClimateBERT—a transformer-based pre-trained language model,
      which has been fine-tuned to better represent domain-specific language used in the climate change context,
      including in scientific abstracts.
    </p>
    <p>
      In accordance with the definitions in our protocol, we further annotated all relevant scientific articles from our
      manually coded training and validation set with regard to the CDR methods covered (Afforestation/Reforestation,
      Restoration of landscapes/peats, Agroforestry, Soil Carbon Sequestration (SCS), Blue Carbon Management (mangroves,
      macroalgae, seagrasses, and salt marshes), Enhanced weathering, Ocean Alkalinity Enhancement (OAE), Ocean
      Fertilisation/Artificial Upwelling, Bioenergy Carbon Capture and Sequestration (BECCS), Direct Air Carbon Capture
      and Sequestration (DACCS), Biochar, additionally we include General Literature on CDR with no focus on a specific
      technology), the scientific method used, as well as the broad area of research (technology study, policy &
      governance, equity, public perception, socio-economic scenarios, earth system science).
    </p>
    <p>
      We used these annotations to train three multi-label classifiers for second stage predictions, and apply them to
      documents predicted relevant at the first stage. We achieve Macro F1/Macro ROC AUC scores 0.77/0.87 for the
      “technology” classifier, 0.69/0.89 for the “methodology” classifier and 0.62/0.77 for the main “area of research”
      classifier. Throughout this process, we evaluate and validate our methodological choices. We test our ClimateBERT
      classifications against classifications from DistilBERT as well as a much simpler classification approach, where
      we use tf idf-encoding together with an SDGClassifier with Huber-loss. ClimateBERT is chosen here due to its
      better performance (see Supplementary Information). We optimise classifier performance by tuning the
      hyperparameters of our model. Finally, we test the complete training strategy in a 3-fold cross validation
      providing us with comprehensive estimates of how the classifiers perform on the complete dataset.
    </p>
    <h5>Classifications</h5>
    <table>
      <thead>
        <tr>
          <th>Labe</th>
          <th>Name (Annotation counts)</th>
          <th>Model</th>
          <th>Precision</th>
          <th>Recall</th>
          <th>F1</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Assessment type</td>
          <td>Side effects (environmental) (yes=530, no=2,402)</td>
          <td>CLIMATEBERT</td>
          <td>84%</td>
          <td>90%</td>
          <td>87%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Economic considerations (yes=280, no=2,654)</td>
          <td>SCIBERT</td>
          <td>80%</td>
          <td>95%</td>
          <td>92%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Storage potentials (yes=1,005, no=1,926)</td>
          <td>CLIMATEBERT</td>
          <td>88%</td>
          <td>93%</td>
          <td>90%</td>
        </tr>
        <tr>
          <td>Research context</td>
          <td>Public perception (yes=42, no=2,893)</td>
          <td>SCIBERT</td>
          <td>75%</td>
          <td>100%</td>
          <td>86%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Governance (yes=101, no=2,833)</td>
          <td>CLIMATEBERT</td>
          <td>59%</td>
          <td>67%</td>
          <td>63%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Socio-economic pathways (yes=309, no=2,624)</td>
          <td>TINYBERT</td>
          <td>61%</td>
          <td>65%</td>
          <td>63%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Technology-focus (yes=2,514, no=420)</td>
          <td>CLIMATEBERT</td>
          <td>97%</td>
          <td>97%</td>
          <td>97%</td>
        </tr>
        <tr>
          <td>Scientific method</td>
          <td>Experimental (field-study) (yes=637, no=4,665)</td>
          <td>SCIBERT</td>
          <td>91%</td>
          <td>86%</td>
          <td>88%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Experimental (laboratory) (yes=1,218, no=4,110)</td>
          <td>SCIBERT</td>
          <td>92%</td>
          <td>93%</td>
          <td>93%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Modelling (yes=714, no=4,599)</td>
          <td>CLIMATEBERT</td>
          <td>84%</td>
          <td>94%</td>
          <td>89%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Life cycle assessment (yes=71, no=5,267)</td>
          <td>CLIMATEBERT</td>
          <td>828%</td>
          <td>90%</td>
          <td>86%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Review (yes=670, no=4,649)</td>
          <td>SCIBERT</td>
          <td>87%</td>
          <td>73%</td>
          <td>79%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Survey (yes=32, no=5,306)</td>
          <td>SCIBERT</td>
          <td>75%</td>
          <td>60%</td>
          <td>67%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Qualitative (yes=80, no=5,246)</td>
          <td>SCIBERT</td>
          <td>70%</td>
          <td>58%</td>
          <td>64%</td>
        </tr>
        <tr>
          <td>Inclusion</td>
          <td>Relevant (yes=3,968, no=4,161)</td>
          <td>CLIMATEBERT</td>
          <td>89%</td>
          <td>94%</td>
          <td>91%</td>
        </tr>
        <tr>
          <td>CDR Method</td>
          <td>Blue carbon (yes=343, no=4,954)</td>
          <td>CLIMATEBERT</td>
          <td>98%</td>
          <td>100%</td>
          <td>99%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>BECCS (yes=331, no=4,998)</td>
          <td>CLIMATEBERT</td>
          <td>90%</td>
          <td>92%</td>
          <td>91%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Biochar (yes=613, no=4,725)</td>
          <td>TINYBERT</td>
          <td>98%</td>
          <td>100%</td>
          <td>99%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>CCS (yes=1,242, no=4,076)</td>
          <td>SCIBERT</td>
          <td>92%</td>
          <td>91%</td>
          <td>91%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>CCUs (yes=163, no=5,168)</td>
          <td>CLIMATEBERT</td>
          <td>72%</td>
          <td>75%</td>
          <td>74%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>DAC(CS) (yes=234, no=5,103)</td>
          <td>SCIBERT</td>
          <td>83%</td>
          <td>97%</td>
          <td>89%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Enhanced weathering (land-based) (yes=164, no=5,175)</td>
          <td>SCIBERT</td>
          <td>74%</td>
          <td>96%</td>
          <td>84%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Ocean fertilization or artificial upwelling (yes=92, no=5,247)</td>
          <td>CLIMATEBERT</td>
          <td>100%</td>
          <td>93%</td>
          <td>96%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Soil carbon sequestration (yes=465, no=4,849)</td>
          <td>SCIBERT</td>
          <td>82%</td>
          <td>82%</td>
          <td>82%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Peatland restoration (yes=163, no=5,172)</td>
          <td>SCIBERT</td>
          <td>96%</td>
          <td>88%</td>
          <td>91%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Algae farming (yes=94, no=5,234)</td>
          <td>TINYBERT</td>
          <td>100%</td>
          <td>93%</td>
          <td>96%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>General CDR literature (yes=105, no=5,233)</td>
          <td>CLIMATEBERT</td>
          <td>100%</td>
          <td>50%</td>
          <td>67%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Forest-based CDR (yes=230, no=5,239)</td>
          <td>SCIBERT</td>
          <td>72%</td>
          <td>94%</td>
          <td>82%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Ocean alkalinity enhancement (extended) (yes=467, no=7,745)</td>
          <td>SCIBERT</td>
          <td>75%</td>
          <td>93%</td>
          <td>83%</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Harvested wood products</td>
          <td>LLM</td>
          <td>--</td>
          <td>--</td>
          <td>--</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Mineral products</td>
          <td>LLM</td>
          <td>--</td>
          <td>--</td>
          <td>--</td>
        </tr>
        <tr>
          <td><br />&nbsp;&nbsp;</td>
          <td>Bio-oil storage</td>
          <td>LLM</td>
          <td>--</td>
          <td>--</td>
          <td>--</td>
        </tr>
      </tbody>
    </table>

    <h5>Number and methods of CDR publications</h5>
    Number and methods of CDR publications This report uses an AI-based approach to identify research publications on
    CDR in the English-language scientific literature. The methodology for this indicator follows Lück et al. (2025)4
    and the methodology used in the last edition of the State of CDR, albeit with some changes. First, combinations of
    search queries were designed for each CDR method based on a comprehensive list of keywords. Compared to the previous
    edition, we revised all queries to cover all fields of meta-data that can be searched in the scholarly databases
    (title, abstract and keywords). The search strings are validated against a set of studies included in the IPCC Sixth
    Assessment Report, ensuring that these studies were returned by the literature search and further refined with
    manually annotated data. For this edition, we also added new queries for six CDR methods: direct ocean capture,
    biomass sinking, biomass burial, mineral products, bio-oil storage, and wood products. These were evaluated against
    a validation set of 10-20 articles per CDR method. Using all search strings, about 412,000 records (after
    deduplication) were retrieved from four bibliographic databases: OpenAlex, Web of Science, Dimensions, and Scopus.
    Note that the analysis in The State of CDR 1st edition queried the Web of Science and Scopus, while the 2nd edition
    relied only on the open-access database OpenAlex. The results in the two previous editions are therefore not
    directly comparable with the results of this edition. For this edition, we expanded the dataset of manually screened
    and labelled abstracts developed in the last edition by manually assessing the suitability for inclusion
    (relevant/irrelevant) and the specific CDR method being studied for the new CDR methods considered in this edition.
    The labelled data were then used to train state-of-the-art machine-learning classifiers to predict a total of
    119,000 relevant CDR research publications as well as the CDR methods covered within them. This automated approach
    enables a comprehensive search for scientific literature in bibliographic databases while still ensuring a high
    level of precision in the identification of relevant studies (see Table A.2.1). To identify the newly added six CDR
    methods, we applied a new approach, using zero-shot classification based on prompting a large language model (GPT
    5.2 via the batch API). We evaluated the approach by manually labelling a validation dataset of 100 abstracts from
    each of the six queries and compared manually and LLM-generated labels to find a good enough performance. To reduce
    the rate of false positives, we only included records that were retrieved with the search query for the respective
    CDR method.

    <h5>Export format</h5>
    <ul>
      <li><strong>tech|0:</strong> CCS</li>
      <li><strong>tech|1:</strong> BECCS</li>
      <li><strong>tech|2:</strong> DAC(CS)</li>
      <li><strong>tech|3:</strong> CCUS</li>
      <li><strong>tech|4:</strong> Soil Carbon Sequestration</li>
      <li><strong>tech|5:</strong> AR</li>
      <li><strong>tech|6:</strong> restoration of landscapes/peats</li>
      <li><strong>tech|7:</strong> Agroforestry</li>
      <li><strong>tech|8:</strong> Forest Management</li>
      <li><strong>tech|9:</strong> Biochar</li>
      <li><strong>tech|10:</strong> Enhanced Weathering (land based)</li>
      <li><strong>tech|11:</strong> Ocean alkalinity enhancement</li>
      <li><strong>tech|12:</strong> Blue Carbon</li>
      <li><strong>tech|13:</strong> Algae farming</li>
      <li><strong>tech|14:</strong> Ocean fertilization & Artificial upwelling</li>
      <li><strong>tech|15:</strong> General Literature on CDR/NET</li>
      <li><strong>tech|16:</strong> Other technologies</li>
      <li><strong>meth|0:</strong> experimental - field / fieldstudy</li>
      <li><strong>meth|1:</strong> experimental - laboratory</li>
      <li><strong>meth|2:</strong> modelling</li>
      <li><strong>meth|3:</strong> data analysis / statistical analysis / econometrics</li>
      <li><strong>meth|4:</strong> Life Cycle Assessments</li>
      <li><strong>meth|5:</strong> review</li>
      <li><strong>meth|6:</strong> systematic reviews</li>
      <li><strong>meth|7:</strong> survey</li>
      <li><strong>meth|8:</strong> qualitative research</li>
      <li><strong>meth|9:</strong> Unknown Method</li>
      <li><strong>cont|0:</strong> earth system</li>
      <li><strong>cont|1:</strong> equity & ethics</li>
      <li><strong>cont|2:</strong> policy/government</li>
      <li><strong>cont|3:</strong> public perception</li>
      <li><strong>cont|4:</strong> socio-economic pathways</li>
      <li><strong>cont|5:</strong> technology</li>
    </ul>
  </div>
</template>

<style scoped></style>
