import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx"
import * as docker from "@pulumi/docker-build"

const ordersECRRepository = new awsx.ecr.Repository("orders-ecr", {
  forceDelete: true,
})

const ordersERCToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: ordersECRRepository.repository.registryId,
})

export const ordersDockerImage = new docker.Image("orders-image", {
  tags: [
    pulumi.interpolate`${ordersECRRepository.repository.repositoryUrl}:latest`,
  ],
  context: {
    location: '../app-orders'
  },
  push: true,
  platforms: [
    "linux/amd64",
  ],
  registries: [
    {
      address: ordersECRRepository.repository.repositoryUrl,
      username: ordersERCToken.userName,
      password: ordersERCToken.password,
    }
  ]
})