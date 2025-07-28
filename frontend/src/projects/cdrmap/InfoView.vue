<script setup lang="ts"></script>

<template>
  <div class="container ms-1 mt-4">
    <h3>Map of literature on carbon dioxide removal</h3>
    <p class="fst-italic">
      <strong>Authors:</strong>
      Sarah Lück, Max Callaghan, Malgorzata Borchers, Annette Cowie, Sabine Fuss, Matthew Gidden, Jens Hartmann, Claudia
      Kammann, David P. Keller, Florian Kraxner, William Lamb, Niall Mac Dowell, Finn Müller-Hansen, Gregory Nemet,
      Benedict Probst, Phil Renforth, Tim Repke, Wilfried Rickels, Ingrid Schulte, Pete Smith, Stephen M Smith, Daniela
      Thrän, Tiffany G. Troxler, Volker Sick, Mijndert van der Spek, Jan C. Minx
    </p>

    <h5>Preprint</h5>
    <p>
      <i>Sarah Lück, Max Callaghan, Malgorzata Borchers et al.</i>
      Scientific literature on carbon dioxide removal much larger than previously suggested: insights from an
      AI-enhanced systematic map, 17 March 2024, PREPRINT available at Research Square [
      <a href="https://www.researchsquare.com/article/rs-4109712/v1" target="_blank">
        https://doi.org/10.21203/rs.3.rs-4109712/v1
      </a>
      ]
    </p>

    <h5>Abstract</h5>
    <p>
      Carbon dioxide removal (CDR) is a critical component of any strategy to limit global warming to well below 2°C and
      rapidly gaining attention in climate research and policymaking. Despite its importance, there have been few
      attempts to systematically evaluate the scientific evidence on CDR. Here we use an approach rooted in artificial
      intelligence to produce a comprehensive systematic map of the CDR literature. In particular, we hand-label 5,339
      documents to train machine learning classifiers with high levels of precision and recall to identify a total of
      <strong>
        28,976 CDR studies across different technology domains and disciplines published in the period 1990-2022 which
        is at least 2-3 times more than previous studies suggested </strong
      >. We paint a granular picture of available CDR research in terms of the CDR methods studied, the geographical
      focus of research, the research method applied, and the broad area of research. The field has grown considerably
      faster than the climate change literature as a whole. This is driven mainly by the rapid expansion of literature
      on biochar, which made up about 62% of CDR publications in 2022. Beyond this stark concentration of CDR research
      on a few individual CDR methods, we find that most studies (86%) focus on improving the CDR methods themselves,
      but there is little research on their societal implications and ethical foundations. Citations patterns from the
      most recent IPCC report strongly differ from publication patterns on CDR in terms of its attention to CDR methods,
      research design and methodological context, as does attention to CDR methods in policy and practice in terms of
      real-world deployments, patenting activity, as well as public investments. As the importance of CDR grows for
      meeting the Paris climate goals, we believe that the accompanying literature database will be of additional value
      for the upcoming IPCC assessment, but also for science, policy and practice.
    </p>

    <h5>Data and Methods</h5>
    <p>
      We use an approach assisted by machine learning to provide the first comprehensive evidence map of CDR research.
      We follow the well established guidelines for systematic mapping (Collaboration for Environmental Evidence 2018),
      wherever possible, and adjust them as needed to align with our machine learning approach. We document all steps in
      a detailed
      <a href="https://docs.google.com/document/d/1OJzGj21Y5B33r85TDwKk2VKhgsR2KakA/edit" target="_blank">
        systematic map protocol
      </a>
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
