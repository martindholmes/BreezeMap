#!/bin/bash

echo "Building test projects..."

ant

echo "Pushing changes up to the hcmc account on nfs.hcmc.uvic.ca using rsync..."
rsync --verbose --progress --stats --compress --recursive --times --perms --delete testsite/ hcmc@nfs.hcmc.uvic.ca:/home1t/hcmc/www/maps/
