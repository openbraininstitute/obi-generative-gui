SHELL := /bin/bash

export ENVIRONMENT ?= dev
export APP_NAME := obi-generative-gui
export APP_VERSION := $(shell git describe --abbrev --dirty --always --tags)
export COMMIT_SHA := $(shell git rev-parse HEAD)
export IMAGE_NAME ?= $(APP_NAME)
export IMAGE_TAG := $(APP_VERSION)
export IMAGE_TAG_ALIAS := latest
ifneq ($(ENVIRONMENT), prod)
	export IMAGE_TAG := $(IMAGE_TAG)-$(ENVIRONMENT)
	export IMAGE_TAG_ALIAS := $(IMAGE_TAG_ALIAS)-$(ENVIRONMENT)
endif

.PHONY: help install build publish run-local run-docker destroy

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-23s\033[0m %s\n", $$1, $$2}'

install:  ## Install dependencies
	npm install

build:  ## Build the Docker image
	docker compose --progress=plain build app

publish: build  ## Publish the Docker image to DockerHub
	docker compose push app

run-local: ## Run the application locally
	npm run dev

run-docker: build  ## Run the application in Docker
	docker compose up app --watch --remove-orphans

destroy:  ## Take down the application and remove the volumes
	docker compose down --remove-orphans --volumes
