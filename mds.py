import csv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.manifold import MDS
import spacy

nlp = spacy.load('en_core_web_sm')


with open('Datasets/documents.tsv','rb') as tsvin:
    documents = csv.DictReader(tsvin, dialect='excel-tab')

    documentContents = []
    documentIds = []
    entities = []

    # generate a list of entities to use as vocab for the TF IDF
    for document in documents:

        doc = nlp(unicode(document['content']))

        for entity in doc.ents:
            ent_str = str(entity).lower()
            if ent_str not in entities:
                entities.append(ent_str)

        documentIds.append(document['id'])
        documentContents.append(document['content'].lower())


vector = TfidfVectorizer(vocabulary=entities).fit_transform(documentContents)

mds_analysis = MDS(n_components=2).fit_transform(vector.toarray())

points = {'x': mds_analysis[:, 0], 'y': mds_analysis[:, 1], 'id': documentIds}

print 'id\tx\ty'

for i, id in enumerate(points['id']):
    print points['id'][i]+'\t'+str(points['x'][i])+'\t'+str(points['y'][i])