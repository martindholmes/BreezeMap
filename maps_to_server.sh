#!/bin/bash

echo "Building test projects..."

cd utilities && ant && cd ../

echo "Pushing changes up to the hcmc account on nfs.hcmc.uvic.ca using rsync..."
rsync --verbose --progress --stats --compress --recursive --times --perms --delete test/ hcmc@nfs.hcmc.uvic.ca:/home1t/hcmc/www/maps/