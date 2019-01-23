import spacy

from spacy.compat import unicode_, json_dumps

import csv
import json

nlp = spacy.load('en_core_web_sm')  # make sure to use larger model!

with open('Datasets/documents.tsv','rb') as tsvin:
    documents = csv.DictReader(tsvin, dialect='excel-tab')

    print 'id\tcontent\tentities'

    for document in documents:
        entities = dict();
        doc = nlp(unicode(document['content']))
        for entity in doc.ents:
            if entity.label_ not in entities:
                entities[entity.label_] = [];
            entities[entity.label_].append(entity.text)
        print document['id']+'\t'+document['content']+'\t'+json.dumps(entities);

