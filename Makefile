.PHONY: setup help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

setup:
	@if ! command -v grunt &> /dev/null; then npm install -g grunt-cli; fi
	npm install
