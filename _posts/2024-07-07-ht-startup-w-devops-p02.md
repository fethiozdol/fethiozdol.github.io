---
layout: post
title: How-to Startup with DevOps from Day 0 – Part 2
date: 2024-07-07 00:00:00
description: |
  This blog series aim to stop you delaying DevOps for your new startup.
  In the first section, I'm going to talk about which DevOps services and tools we use at Xecuta and later a simple shared services account architecture that serve us in our early days.
tags: devops day0 aws terraform azure-devops
categories: >
  startup
featured: true
mermaid:
  enabled: true
  zoomable: true
giscus_comments: true
related_posts: false
---

# Shared Services

Our Shared Services may initially have:

- Route 53 Public Zone for the company domain apex (i.e. example.com)
- SES Domain Identities (i.e. example.com and nonprod.example.com)
- If there will be build agents:
  - A VPC with NAT(s)
  - Pipelines that will be triggered manually or periodically to build and rotate build agents
  - Build agents(if any)
- Build artifact repositories for anything that runs in our all accounts. These can be any one or more from:
  - S3 Bucket(s)
  - AWS CodeArtifact
  - A Custom vendor-provided system like Sonatype Nexus
  - ECR repositories for any Docker images

> As our build artifacts will be immutable and environment-agnostic, our deployment processes should retrieve build artifacts from the _Shared Services_ AWS account and deploy them to the target environment, which will be a workload AWS account.
