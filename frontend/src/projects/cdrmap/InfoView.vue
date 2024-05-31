<script setup lang="ts"></script>

<template>
  <h3>Map of literature on carbon dioxide removal</h3>
  <p class="fst-italic">
    <strong>Authors:</strong>
    Sarah Lück, Max Callaghan, Malgorzata Borchers, Annette Cowie, Sabine Fuss, Matthew Gidden, Jens
    Hartmann, Claudia Kammann, David P. Keller, Florian Kraxner, William Lamb, Niall Mac Dowell, Finn Müller-Hansen,
    Gregory Nemet, Benedict Probst, Phil Renforth, Tim Repke, Wilfried Rickels, Ingrid Schulte, Pete Smith, Stephen M
    Smith, Daniela Thrän, Tiffany G. Troxler, Volker Sick, Mijndert van der Spek, Jan C. Minx
  </p>


  <h5>Preprint</h5>
<a href="https://www.researchsquare.com/article/rs-4109712/v1" target="_blank">Scientific literature on carbon dioxide removal much larger than previously suggested: insights from an AI-enhanced systematic map</a>


  <h5>Data and Methods</h5>

We use an approach assisted by machine learning to provide the first comprehensive evidence map of CDR research. We follow the well established guidelines for systematic mapping (Collaboration for Environmental Evidence 2018), wherever possible, and adjust them as needed to align with our machine learning approach. We document all steps in a detailed <a href="https://docs.google.com/document/d/1OJzGj21Y5B33r85TDwKk2VKhgsR2KakA/edit" target="_blank">systematic map protocol</a> for transparency and reproducibility.

We started by developing, for each CDR method, search strings with high levels of recall to make sure that as few scientific articles are missed as possible. The search strings include keywords describing the CDR technology. For long established methods such as afforestation we included keywords that make sure the method is evaluated with a focus on carbon sequestration. The development of search strings was done iteratively by validating against an independent list of publications on the various CDR methods ensuring that all documents are returned. The validation dataset was extracted from IPCC AR6 and 50 randomly selected publications from the <a href="https://www.american.edu/sis/centers/carbon-removal/carbon-removal-glossary.cfm" target="_blank">CDR bibliography</a> published by the Climate Protection and Restoration Initiative. We then ran the final search strings on Open Alex and retrieved 100,000 bibliographic records. 

In the next step we work towards precision by developing a machine-learning classifier to distinguish relevant, namely all studies on negative emissions and CDR, from irrelevant scientific studies in our query. We manually screen and annotate a total of 5,339 documents – 100-600 per CDR method – for inclusion according to our codebook. To ensure reproducibility, each document is screened and annotated by two coders as recommended by the relevant guidelines (Collaboration for Environmental Evidence 2018). We use our annotations to train and validate binary classifiers - automatic sorting into predefined categories - to predict inclusion, using the title and abstract of the documents as inputs. The best performing classifier (F1: 0.91; ROC-AUC: 0.85) is derived from ClimateBERT - a transformer-based pre-trained language model, which has been fine-tuned to better represent domain-specific language used in the climate change context, including in scientific abstracts.

In accordance with the definitions in our protocol, we further annotated all relevant scientific articles from our manually coded training and validation set with regard to the CDR methods covered (Afforestation/Reforestation, Restoration of landscapes/peats, Agroforestry, Soil Carbon Sequestration (SCS), Blue Carbon Management (mangroves, macroalgae, seagrasses, and salt marshes), Enhanced weathering, Ocean Alkalinity Enhancement (OAE), Ocean Fertilisation/Artificial Upwelling, Bioenergy Carbon Capture and Sequestration (BECCS), Direct Air Carbon Capture and Sequestration (DACCS), Biochar, additionally we include General Literature on CDR with no focus on a specific technology), the scientific method used, as well as the broad area of research (technology study, policy & governance, equity, public perception, socio-economic scenarios, earth system science). We used these annotations to train three multi-label classifiers for second stage predictions, and apply them to documents predicted relevant at the first stage. We achieve Macro F1/Macro ROC AUC scores 0.77/0.87 for the “technology” classifier, 0.69/0.89 for the “methodology” classifier and 0.62/0.77 for the main “area of research” classifier. 

Throughout this process, we evaluate and validate our methodological choices. We test our ClimateBERT classifications against classifications from DistilBERT as well as a much simpler classification approach, where we use tf idf-encoding together with an SDGClassifier with Huber-loss. ClimateBERT is chosen here due to its better performance (see Supplementary Information). We optimise classifier performance by tuning the hyperparameters of our model. Finally, we test the complete training strategy in a 3-fold cross validation providing us with comprehensive estimates of how the classifiers perform on the complete dataset. 
</template>



<style scoped></style>
