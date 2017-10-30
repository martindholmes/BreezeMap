#!/bin/bash

echo "Pushing changes up to the mholmes/test account on nfs.hcmc.uvic.ca using rsync."
rsync --verbose --progress --stats --compress --recursive --times --perms --exclude '.git' --exclude 'docs' --exclude 'utilities' --exclude 'xml' --exclude 'js/ol3latest.json' --exclude 'js/placemark.svg' --exclude 'LICENSE' --exclude 'README.md' --exclude 'breezemap.xpr' --exclude 'ol3' --exclude '*.sh' . mholmes@nfs.hcmc.uvic.ca:/home1t/mholmes/www/test/

scp tei2017.html mholmes@nfs.hcmc.uvic.ca:/home1t/mholmes/www/test/index.html