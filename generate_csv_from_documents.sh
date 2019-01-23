#!/bin/bash
set -e

echo -e id'\t'content > documents.tsv

for filename in ./Documents/*; do
    if [[ "$filename" != *"_docs.txt"* ]];then
        echo -e "${filename//.\/Documents\//}\t$(cat $filename)" >> documents.tsv
     fi
done
