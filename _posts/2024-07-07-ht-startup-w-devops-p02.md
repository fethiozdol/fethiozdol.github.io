---
layout: post
title: Kickstarting Your Startup with DevOps from Day Zero – Part 2
date: 2025-01-01 00:00:00
description: |
  This blog series aim to stop you delaying DevOps for your new startup.
  In the first part of this series, I'll talk about our architecture principles and our design thinking which led us to organize our AWS environments and choose tools and services.
tags: devops day0 aws terraform cdk aws-cdk
categories: >
  startup
featured: true
mermaid:
  enabled: true
  zoomable: true
images:
  compare: false
  slider: true
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
