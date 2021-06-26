#!/bin/bash

imageName=$1
containerName=metroid

# Remove running containers
docker kill $containerName
docker container rm $containerName

# Re-build image
docker build . -t $imageName

# Run a container from the newly-built image
docker run --init -d --name $containerName $imageName

# Follow the logs of the new container
docker logs -f $containerName
