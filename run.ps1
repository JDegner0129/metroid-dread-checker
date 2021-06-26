param ($ImageName)

$ContainerName = 'metroid';

# Remove running containers
docker kill $ContainerName;
docker container rm $ContainerName;

# Re-build image
docker build . -t $ImageName

# Run a container from the newly-built image
docker run --init -d --name $ContainerName $ImageName

# Follow the logs of the new container
docker logs -f $ContainerName
